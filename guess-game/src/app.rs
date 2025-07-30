use std::collections::{BTreeMap, HashMap};

use anyhow::{Context, Result};
use kolme::*;

use crate::{
    rng_server::RngResult,
    state::{GuessState, Wager},
    time::GuessTimestamp,
};

/// The application data structure itself.
#[derive(Clone)]
pub struct GuessGame {
    genesis_info: GenesisInfo,
    rng_public_key: PublicKey,
}

/// All the different actions a client can perform on this app.
#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum GuessMessage {
    /// Requests 100 tokens.
    GrabFunds {},
    /// Place a bet for the current round of betting.
    ///
    /// Note: this will fail if you have insufficient funds!
    PlaceBet { guess: u8, amount: Decimal },
    /// Settle a round of betting with the given result.
    ///
    /// Note that this is an unprivileged message! Security
    /// is provided via the signature on the result, proving
    /// that it came from the official RNG server.
    SettleBet { result: SignedTaggedJson<RngResult> },
}

/// App specific log messages.
///
/// The standard pattern in Kolme is to generate log messages for
/// consumption by the indexer. Kolme itself generates framework messages
/// as well.
#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GuessGameLog {
    NewWinner {
        finished: GuessTimestamp,
        number: u8,
    },
    Winnings {
        winner: AccountId,
        amount: Decimal,
    },
}

impl GuessGame {
    pub const CODE_VERSION: &str = "v1.0.0";

    pub fn new(validator_public_key: PublicKey, rng_public_key: PublicKey) -> Self {
        GuessGame {
            genesis_info: GenesisInfo {
                kolme_ident: "RareEvo 2025 Kolme App - Guessing Game".to_owned(),
                validator_set: ValidatorSet {
                    processor: validator_public_key,
                    listeners: std::iter::once(validator_public_key).collect(),
                    needed_listeners: 1,
                    approvers: std::iter::once(validator_public_key).collect(),
                    needed_approvers: 1,
                },
                chains: ConfiguredChains::default(),
                version: Self::CODE_VERSION.to_owned(),
            },
            rng_public_key,
        }
    }
}

const ASSET_ID: AssetId = AssetId(0);

impl KolmeApp for GuessGame {
    type State = GuessState;

    type Message = GuessMessage;

    fn genesis_info(&self) -> &kolme::GenesisInfo {
        &self.genesis_info
    }

    fn new_state(&self) -> Result<Self::State> {
        Ok(GuessState {
            rng_public_key: self.rng_public_key,
            received_funds: MerkleMap::new(),
            pending_wagers: MerkleMap::new(),
        })
    }

    async fn execute(
        &self,
        ctx: &mut kolme::ExecutionContext<'_, Self>,
        msg: &Self::Message,
    ) -> Result<()> {
        match msg {
            GuessMessage::GrabFunds {} => {
                grab_funds(ctx)?;
            }
            GuessMessage::PlaceBet { guess, amount } => {
                place_bet(ctx, *guess, *amount)?;
            }
            GuessMessage::SettleBet { result } => {
                settle_bet(ctx, result)?;
            }
        }

        Ok(())
    }
}

fn grab_funds(ctx: &mut ExecutionContext<'_, GuessGame>) -> Result<()> {
    let sender = ctx.get_sender_id();
    let height = ctx.block_height();
    let old = ctx.state_mut().received_funds.insert(sender, height);
    anyhow::ensure!(
        old.is_none(),
        "Account {} already received funds",
        ctx.get_sender_id()
    );
    ctx.mint_asset(ASSET_ID, sender, rust_decimal::dec! {100})?;
    Ok(())
}

fn place_bet(ctx: &mut ExecutionContext<'_, GuessGame>, guess: u8, amount: Decimal) -> Result<()> {
    let sender = ctx.get_sender_id();
    let timestamp = GuessTimestamp::after(ctx.block_time());
    ctx.burn_asset(ASSET_ID, sender, amount)?;
    ctx.state_mut()
        .pending_wagers
        .get_or_default(timestamp)
        .push(Wager {
            account: sender,
            guess,
            amount,
        });
    Ok(())
}

fn settle_bet(
    ctx: &mut ExecutionContext<'_, GuessGame>,
    result: &SignedTaggedJson<RngResult>,
) -> Result<()> {
    let pubkey = result.verify_signature()?;
    anyhow::ensure!(pubkey == ctx.app_state().rng_public_key);
    let RngResult { number, timestamp } = result.message.as_inner();
    let timestamp = GuessTimestamp::try_from(*timestamp)?;
    let wagers = ctx
        .app_state_mut()
        .pending_wagers
        .remove(&timestamp)
        .context("No pending wagers for given timestamp found")?
        .1;
    let number = (*number % 256) as u8;

    let mut total_bet = Decimal::ZERO;
    let mut winning_weights = HashMap::<_, Decimal>::new();
    let mut winning_distance = u8::MAX;
    let mut total_weight = Decimal::ZERO;

    for Wager {
        account,
        guess,
        amount,
    } in wagers
    {
        total_bet += amount;
        let distance = guess.abs_diff(number);
        match distance.cmp(&winning_distance) {
            // New winner! Flush out the old values.
            std::cmp::Ordering::Less => {
                winning_distance = distance;
                winning_weights.clear();
                total_weight = Decimal::ZERO;
            }
            // This is also a winner
            std::cmp::Ordering::Equal => (),
            // Not a winner :(
            std::cmp::Ordering::Greater => continue,
        }
        *winning_weights.entry(account).or_default() += amount;
        total_weight += amount;
    }

    let mut winnings = BTreeMap::new();

    ctx.log_json(&GuessGameLog::NewWinner {
        finished: timestamp,
        number,
    })?;

    for (winner, weight) in winning_weights {
        let amount = total_bet * weight / total_weight;
        ctx.log_json(&GuessGameLog::Winnings { winner, amount })?;
        ctx.mint_asset(ASSET_ID, winner, amount)?;
        winnings.insert(winner, amount);
    }

    Ok(())
}

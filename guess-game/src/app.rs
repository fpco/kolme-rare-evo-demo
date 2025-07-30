use std::collections::{BTreeMap, HashMap};

use anyhow::{Context, Result};
use kolme::*;

use crate::{
    rng_server::RngResult,
    state::{GuessState, Wager},
    time::GuessTimestamp,
};

#[derive(Clone)]
pub struct GuessGame {
    genesis_info: GenesisInfo,
    rng_public_key: PublicKey,
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

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum GuessMessage {
    GrabFunds {},
    PlaceBet { guess: u8, amount: Decimal },
    SettleBet { result: SignedTaggedJson<RngResult> },
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
                let sender = ctx.get_sender_id();
                let height = ctx.block_height();
                let old = ctx.state_mut().received_funds.insert(sender, height);
                anyhow::ensure!(
                    old.is_none(),
                    "Account {} already received funds",
                    ctx.get_sender_id()
                );
                ctx.mint_asset(ASSET_ID, sender, rust_decimal::dec! {100})?;
            }
            GuessMessage::PlaceBet { guess, amount } => {
                let sender = ctx.get_sender_id();
                let timestamp = GuessTimestamp::after(ctx.block_time());
                ctx.burn_asset(ASSET_ID, sender, *amount)?;
                ctx.state_mut()
                    .pending_wagers
                    .get_or_default(timestamp)
                    .push(Wager {
                        account: sender,
                        guess: *guess,
                        amount: *amount,
                    });
            }
            GuessMessage::SettleBet { result } => {
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
            }
        }

        Ok(())
    }
}

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

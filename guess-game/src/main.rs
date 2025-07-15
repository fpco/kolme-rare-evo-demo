use std::{collections::HashMap, net::SocketAddr, path::PathBuf};

use anyhow::{Context, Result};
use clap::Parser;
use kolme::*;
use reqwest::Url;
use tokio::task::JoinSet;

#[derive(clap::Parser)]
#[allow(clippy::large_enum_variant)]
enum Cmd {
    GenKeypair,
    Serve {
        #[clap(flatten)]
        opt: ServeOpt,
    },
}

#[derive(clap::Parser)]
struct ServeOpt {
    #[clap(
        long,
        env = "RNG_SERVER",
        default_value = "https://rng.prod.fpcomplete.com"
    )]
    rng_server: Url,
    #[clap(
        long,
        env = "RNG_PUBLIC_KEY",
        default_value = "0294c4243aa4452127fa8a13a18c54ace42df8da14637e9c80dccf953a27b9f917"
    )]
    rng_public_key: PublicKey,
    #[clap(long, env = "VALIDATOR_SECRET_KEY")]
    validator_secret_key: SecretKey,
    #[clap(long, env = "FJALL_DIR", default_value = "fjall-dir")]
    fjall_dir: PathBuf,
    #[clap(long, env = "BIND", default_value = "[::]:3000")]
    bind: SocketAddr,
}

#[tokio::main]
async fn main() -> Result<()> {
    match Cmd::parse() {
        Cmd::GenKeypair => gen_keypair(),
        Cmd::Serve { opt } => serve(opt).await?,
    }

    Ok(())
}

fn gen_keypair() {
    let secret = SecretKey::random();
    let public = secret.public_key();
    println!("Public key: {public}");
    println!("Secret key: {}", secret.reveal_as_hex());
}

async fn serve(opt: ServeOpt) -> Result<()> {
    let ServeOpt {
        rng_server,
        rng_public_key,
        validator_secret_key,
        fjall_dir,
        bind,
    } = opt;

    let client = reqwest::ClientBuilder::new().build()?;
    let actual_public_key: PublicKey = client
        .get(rng_server.join("public-key")?)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    anyhow::ensure!(rng_public_key == actual_public_key);
    println!("Confirmed RNG server is using expected public key {rng_public_key}");

    let game = GuessGame::new(validator_secret_key.public_key(), rng_public_key);
    let mut set = JoinSet::new();
    let kolme = Kolme::new(game, CODE_VERSION, KolmeStore::new_fjall(&fjall_dir)?).await?;
    set.spawn(Processor::new(kolme.clone(), validator_secret_key).run());
    set.spawn(ApiServer::new(kolme.clone()).run(bind));
    set.spawn(state_printer(kolme.clone()));
    set.spawn(settler(kolme.clone(), client, rng_server));
    set.spawn(leaderboard(kolme));

    set.join_next()
        .await
        .context("Impossible: join_next returned None")?
        .context("Task panicked")?
}

#[derive(Clone)]
struct GuessGame {
    genesis_info: GenesisInfo,
    rng_public_key: PublicKey,
}

const CODE_VERSION: &str = "v1.0.0";

impl GuessGame {
    fn new(validator_public_key: PublicKey, rng_public_key: PublicKey) -> Self {
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
                version: CODE_VERSION.to_owned(),
            },
            rng_public_key,
        }
    }
}

/// A guess timestamp, which is minutes from the epoch.
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
struct GuessTimestamp(u64);

impl ToMerkleKey for GuessTimestamp {
    fn to_merkle_key(&self) -> MerkleKey {
        self.0.to_merkle_key()
    }
}

impl FromMerkleKey for GuessTimestamp {
    fn from_merkle_key(bytes: &[u8]) -> Result<Self, MerkleSerialError> {
        u64::from_merkle_key(bytes).map(Self)
    }
}

impl GuessTimestamp {
    /// Find the next guess timestamp after the given timestamp.
    ///
    /// Panics if given a timestamp from before the Unix epoch.
    fn after(timestamp: Timestamp) -> Self {
        GuessTimestamp(
            u64::try_from(timestamp.as_second())
                .expect("GuessTimestamp::after: received timestamp from before the epoch")
                / 60
                + 1,
        )
    }
}

impl TryFrom<&GuessTimestamp> for Timestamp {
    type Error = anyhow::Error;

    fn try_from(
        GuessTimestamp(minutes): &GuessTimestamp,
    ) -> std::result::Result<Self, Self::Error> {
        let seconds = minutes * 60;
        Ok(Timestamp::from_second(i64::try_from(seconds)?)?)
    }
}

impl TryFrom<i64> for GuessTimestamp {
    type Error = anyhow::Error;

    fn try_from(value: i64) -> std::result::Result<Self, Self::Error> {
        Ok(GuessTimestamp(u64::try_from(value)?))
    }
}

#[derive(Debug, Clone)]
struct GuessState {
    rng_public_key: PublicKey,
    received_funds: MerkleMap<AccountId, BlockHeight>,
    pending_wagers: MerkleMap<GuessTimestamp, MerkleVec<Wager>>,
}

#[derive(Debug, Clone)]
struct Wager {
    account: AccountId,
    guess: u8,
    amount: Decimal,
}

impl MerkleSerialize for GuessState {
    fn merkle_serialize(
        &self,
        serializer: &mut kolme::MerkleSerializer,
    ) -> Result<(), kolme::MerkleSerialError> {
        let Self {
            rng_public_key,
            received_funds,
            pending_wagers,
        } = self;
        serializer.store(rng_public_key)?;
        serializer.store(received_funds)?;
        serializer.store(pending_wagers)?;
        Ok(())
    }
}

impl MerkleDeserialize for GuessState {
    fn merkle_deserialize(
        deserializer: &mut kolme::MerkleDeserializer,
        _version: usize,
    ) -> Result<Self, kolme::MerkleSerialError> {
        Ok(Self {
            rng_public_key: deserializer.load()?,
            received_funds: deserializer.load()?,
            pending_wagers: deserializer.load()?,
        })
    }
}

impl MerkleSerialize for Wager {
    fn merkle_serialize(&self, serializer: &mut MerkleSerializer) -> Result<(), MerkleSerialError> {
        let Self {
            account,
            guess,
            amount,
        } = self;
        serializer.store(account)?;
        serializer.store(guess)?;
        serializer.store(amount)?;
        Ok(())
    }
}

impl MerkleDeserialize for Wager {
    fn merkle_deserialize(
        deserializer: &mut MerkleDeserializer,
        _version: usize,
    ) -> Result<Self, MerkleSerialError> {
        Ok(Self {
            account: deserializer.load()?,
            guess: deserializer.load()?,
            amount: deserializer.load()?,
        })
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
enum GuessMessage {
    GrabFunds {},
    PlaceBet {
        guess: u8,
        amount: Decimal,
    },
    SettleBet {
        result: SignedTaggedJson<NumberResult>,
    },
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
                let NumberResult { number, timestamp } = result.message.as_inner();
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
                let mut winning_distance = 255u8;
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

                for (winner, weight) in winning_weights {
                    let winnings = total_bet * weight / total_weight;
                    ctx.log_json(&WinningsMessage { winner, winnings })?;
                    ctx.mint_asset(ASSET_ID, winner, winnings)?;
                }
            }
        }

        Ok(())
    }
}

async fn state_printer(kolme: Kolme<GuessGame>) -> Result<()> {
    let mut subscription = kolme.subscribe();
    loop {
        state_printer_single(kolme.read()).await;
        if let Notification::NewBlock(block) = subscription.recv().await? {
            println!("\n\nNew block: {block:?}");
            let block = kolme
                .get_block(block.height())
                .await?
                .context("Impossible missing block")?;
            for logs in &*block.logs {
                for log in logs {
                    println!("{log}");
                }
            }
            println!("\n\n");
        };
    }
}

async fn state_printer_single(kolme: KolmeRead<GuessGame>) {
    println!();
    println!("Next block: {}", kolme.get_next_height());
    println!("Current framework state: {:?}", kolme.get_framework_state());
    println!("Current application state: {:?}", kolme.get_app_state());
    println!();
}

async fn settler(kolme: Kolme<GuessGame>, client: reqwest::Client, rng_server: Url) -> Result<()> {
    let secret = SecretKey::random();
    loop {
        // Better than just sleeping 1 second would be to do proper scheduling.
        // Not doing that because the logic is semi-complicated and not important
        // for implementing the core demo.
        if let Err(e) = settler_once(&kolme, &client, &rng_server, &secret).await {
            println!("Error settling: {e}");
        }

        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
}

async fn settler_once(
    kolme: &Kolme<GuessGame>,
    client: &reqwest::Client,
    rng_server: &Url,
    secret: &SecretKey,
) -> Result<()> {
    let kolme_r = kolme.read();
    let Some((guess_timestamp, _wagers)) = kolme_r.get_app_state().pending_wagers.iter().next()
    else {
        return Ok(());
    };
    let timestamp = Timestamp::try_from(guess_timestamp)?;
    if timestamp > Timestamp::now() {
        return Ok(());
    }
    #[derive(serde::Deserialize)]
    struct NumberRes {
        signature: Signature,
        serialized: String,
        recovery_id: RecoveryId,
    }
    let NumberRes {
        signature,
        serialized,
        recovery_id,
    } = client
        .get(
            rng_server
                .join("number/")?
                .join(&guess_timestamp.0.to_string())?,
        )
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    let signed = SignedTaggedJson::<NumberResult> {
        message: TaggedJson::try_from_string(serialized)?,
        signature,
        recovery_id,
    };
    anyhow::ensure!(signed.verify_signature()? == kolme_r.get_app_state().rng_public_key);
    kolme
        .sign_propose_await_transaction(
            secret,
            vec![Message::App(GuessMessage::SettleBet { result: signed })],
        )
        .await?;
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq, Eq, Clone)]
struct NumberResult {
    number: u32,
    timestamp: i64,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct WinningsMessage {
    winner: AccountId,
    winnings: Decimal,
}

async fn leaderboard(kolme: Kolme<GuessGame>) -> Result<()> {
    let mut totals = HashMap::<AccountId, Decimal>::new();
    let mut next_height = BlockHeight::start();
    let mut recv = kolme.subscribe();
    loop {
        match kolme.get_block(next_height).await? {
            None => {
                recv.recv().await?;
                continue;
            }
            Some(block) => {
                for logs in &*block.logs {
                    for log in logs {
                        match serde_json::from_str(log) {
                            Err(_) => continue,
                            Ok(WinningsMessage { winner, winnings }) => {
                                *totals.entry(winner).or_default() += winnings;
                            }
                        }
                    }
                }

                println!("\n\nLeaderboard as of {}", block.height);

                let mut winners = totals.iter().collect::<Vec<_>>();
                winners.sort_by(|x, y| y.1.cmp(x.1));
                for (idx, (winner, winnings)) in winners.iter().take(1).enumerate() {
                    println!("{}: account {winner}: {winnings}", idx + 1);
                }

                next_height = next_height.next();
            }
        }
    }
}

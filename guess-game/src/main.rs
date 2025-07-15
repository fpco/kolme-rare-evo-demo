use std::{net::SocketAddr, path::PathBuf};

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

    let game = GuessGame::new(validator_secret_key.public_key());
    let mut set = JoinSet::new();
    let kolme = Kolme::new(game, CODE_VERSION, KolmeStore::new_fjall(&fjall_dir)?).await?;
    set.spawn(Processor::new(kolme.clone(), validator_secret_key).run());
    set.spawn(ApiServer::new(kolme.clone()).run(bind));
    set.spawn(state_printer(kolme));

    set.join_next()
        .await
        .context("Impossible: join_next returned None")?
        .context("Task panicked")?
}

#[derive(Clone)]
struct GuessGame {
    genesis_info: GenesisInfo,
}

const CODE_VERSION: &str = "v1.0.0";

impl GuessGame {
    fn new(validator_public_key: PublicKey) -> Self {
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
        }
    }
}

/// A guess timestamp, which is minutes from the epoch.
#[derive(Debug, Clone)]
struct GuessTimestamp(u64);

impl ToMerkleKey for GuessTimestamp {
    fn to_merkle_key(&self) -> MerkleKey {
        self.0.to_merkle_key()
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

#[derive(Debug, Clone)]
struct GuessState {
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
            received_funds,
            pending_wagers,
        } = self;
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
            received_funds: deserializer.load()?,
        })
    }
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
enum GuessMessage {
    GrabFunds {},
    PlaceBet { guess: u8, amount: Decimal },
}

const ASSET_ID: AssetId = AssetId(0);

impl KolmeApp for GuessGame {
    type State = GuessState;

    type Message = GuessMessage;

    fn genesis_info(&self) -> &kolme::GenesisInfo {
        &self.genesis_info
    }

    fn new_state() -> Result<Self::State> {
        Ok(GuessState {
            received_funds: MerkleMap::new(),
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
                let minutes = u64::try_from(ctx.block_time().as_second())? / 60 + 1;
            }
        }

        Ok(())
    }
}

async fn state_printer(kolme: Kolme<GuessGame>) -> Result<()> {
    let mut subscription = kolme.subscribe();
    loop {
        state_printer_single(kolme.read()).await;
        subscription.recv().await?;
    }
}

async fn state_printer_single(kolme: KolmeRead<GuessGame>) {
    println!("Next block: {}", kolme.get_next_height());
    println!(
        "Current framework state: {:#?}",
        kolme.get_framework_state()
    );
    println!("Current application state: {:#?}", kolme.get_app_state());
}

mod api;
mod app;
mod bot;
mod cli;
mod rng_server;
mod state;
mod time;

use anyhow::{Context, Result};
use api::make_api_server;
use app::GuessGame;
use bot::bot;
use clap::Parser;
use cli::Opt;
use kolme::*;
use tokio::task::JoinSet;

#[tokio::main]
async fn main() -> Result<()> {
    serve(Opt::parse()).await
}

async fn serve(opt: Opt) -> Result<()> {
    let Opt {
        rng_server_url,
        rng_public_key,
        validator_secret_key,
        fjall_dir,
        postgres,
        bind,
    } = opt;

    // Initialize the RngServer value which will be used for looking up
    // random number results.
    let rng_server = rng_server::RngServer::new(&rng_server_url, rng_public_key).await?;

    // Initialize the GuessGame value, the core of any Kolme application.
    let game = GuessGame::new(validator_secret_key.public_key(), rng_public_key);

    // Initialize the storage layer used by Kolme. For local testing, we stick
    // to Fjall for simplicity. Our deployed server uses PostgreSQL, which allows
    // for shared block storage and high availability processors.
    let store = match postgres {
        Some(postgres) => KolmeStore::new_postgres(&postgres).await?,
        None => KolmeStore::new_fjall(&fjall_dir)?,
    };

    // Create the actual Kolme value which will be used for running all our components.
    let kolme = Kolme::new(game, GuessGame::CODE_VERSION, store).await?;

    // Kolme applications run as multiple different components all sharing one core Kolme.
    // We'll launch all components into a JoinSet. Since components are intended to never
    // exit, we'll park our main thread waiting for anything to exit from the JoinSet.
    let mut set = JoinSet::new();

    // The processor is responsible for receiving incoming transactions and producing blocks.
    set.spawn(Processor::new(kolme.clone(), validator_secret_key).run());

    // The API server provides an HTTP API for the frontend to interact with the chain.
    set.spawn(make_api_server(kolme.clone()).run(bind));

    // The bot is responsible for periodically checking for new random numbers and
    // updating the chain.
    set.spawn(bot(kolme.clone(), rng_server));

    set.join_next()
        .await
        .context("Impossible: join_next returned None")?
        .context("Task panicked")?
}

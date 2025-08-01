use anyhow::Result;
use kolme::*;

use crate::{
    app::{GuessGame, GuessMessage},
    rng_server::RngServer,
};

pub async fn bot(kolme: Kolme<GuessGame>, rng_server: RngServer) -> Result<()> {
    let secret = SecretKey::random();
    loop {
        // Better than just sleeping 1 second would be to do proper scheduling.
        // Not doing that because the logic is semi-complicated and not important
        // for implementing the core demo.
        if let Err(e) = bot_once(&kolme, &rng_server, &secret).await {
            println!("Error settling: {e}");
        }

        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
}

async fn bot_once(
    kolme: &Kolme<GuessGame>,
    rng_server: &RngServer,
    secret: &SecretKey,
) -> Result<()> {
    todo!()
}

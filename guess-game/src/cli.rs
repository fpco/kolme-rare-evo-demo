use std::{net::SocketAddr, path::PathBuf};

use kolme::{PublicKey, SecretKey};
use reqwest::Url;

#[derive(clap::Parser)]
pub struct Opt {
    /// Root URL for the RNG server
    #[clap(
        long,
        env = "RNG_SERVER",
        default_value = "https://rng.prod.fpcomplete.com"
    )]
    pub rng_server_url: Url,
    /// Public key of the RNG server
    ///
    /// We specify this and then verify it against the server to ensure
    /// we don't get poisoned by a fake server. There's no real money
    /// in this game, but that doesn't mean we should be lax with security!
    #[clap(
        long,
        env = "RNG_PUBLIC_KEY",
        default_value = "0294c4243aa4452127fa8a13a18c54ace42df8da14637e9c80dccf953a27b9f917"
    )]
    pub rng_public_key: PublicKey,
    /// Secret key used for the validators.
    ///
    /// Since this application includes no external chains, we use the same
    /// validator for processor, listener, and approver. This is a security
    /// no-no, it makes the chain fully controlled by a single entity.
    /// I guess in this case we _will_ be lax with security :)
    #[clap(long, env = "VALIDATOR_SECRET_KEY")]
    pub validator_secret_key: SecretKey,
    /// Fjall directory. Will be ignored if a PostgreSQL connection string is provided.
    #[clap(long, env = "FJALL_DIR", default_value = "fjall-dir")]
    pub fjall_dir: PathBuf,
    /// PostgreSQL connection string, will override a Fjall directory
    #[clap(long, env = "POSTGRES_CONN_STR")]
    pub postgres: Option<String>,
    #[clap(long, env = "BIND", default_value = "[::]:3000")]
    pub bind: SocketAddr,
}

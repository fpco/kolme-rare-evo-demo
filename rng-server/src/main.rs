use axum::Json;
use axum::{extract::State, routing::get, Router};
use clap::{Parser, Subcommand};
use k256::{
    ecdsa::{signature::Signer, Signature, SigningKey},
    elliptic_curve::rand_core::OsRng,
};
use serde::Serialize;
use std::net::SocketAddr;

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Serve {
        #[clap(long, env = "BIND", default_value = "[::]:3000")]
        bind: SocketAddr,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Serve { bind } => {
            println!("Starting server on {}", bind);

            let signing_key = SigningKey::random(&mut OsRng);

            let app = Router::new()
                .route("/", get(root))
                .route("/public-key", get(public_key))
                .with_state(signing_key);

            let listener = tokio::net::TcpListener::bind(bind).await?;
            axum::serve(listener, app).await?;

            Ok(())
        }
    }
}

#[derive(Serialize)]
struct Response {
    number: u32,
    signature: String,
}

async fn root(State(signing_key): State<SigningKey>) -> Json<Response> {
    let magic_number: u32 = 42;
    let signature: Signature = signing_key.sign(&magic_number.to_be_bytes());

    Json(Response {
        number: magic_number,
        signature: signature.to_string(),
    })
}

async fn public_key(State(signing_key): State<SigningKey>) -> String {
    let public_key = signing_key.verifying_key();
    hex::encode(public_key.to_sec1_bytes())
}

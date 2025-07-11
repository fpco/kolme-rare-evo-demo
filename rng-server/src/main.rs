use axum::extract::Path;
use axum::Json;
use axum::{extract::State, routing::get, Router};
use clap::{Parser, Subcommand};
use k256::ecdsa::{signature::Signer, Signature, SigningKey};
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
        #[clap(long, env = "SIGNING_KEY")]
        signing_key: String,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Serve { bind, signing_key } => {
            println!("Starting server on {}", bind);

            let key_bytes = hex::decode(signing_key)?;
            let signing_key = SigningKey::from_bytes(
                key_bytes
                    .as_slice()
                    .try_into()
                    .map_err(|_| anyhow::anyhow!("signing_key must be 32 bytes"))?,
            )?;

            let app = Router::new()
                .route("/number/{timestamp}", get(generate_signed_number))
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

async fn generate_signed_number(
    State(signing_key): State<SigningKey>,
    Path(_timestamp): Path<u64>,
) -> Result<Json<Response>, axum::http::StatusCode> {
    let magic_number: u32 = rand::random();
    let signature: Signature = signing_key
        .try_sign(&magic_number.to_be_bytes())
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(Response {
        number: magic_number,
        signature: signature.to_string(),
    }))
}

async fn public_key(State(signing_key): State<SigningKey>) -> String {
    let public_key = signing_key.verifying_key();
    hex::encode(public_key.to_sec1_bytes())
}

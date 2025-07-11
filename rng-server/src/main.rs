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
            println!("Starting server on {bind}");

            let key_bytes = hex::decode(signing_key)?;
            let signing_key = SigningKey::from_bytes(key_bytes.as_slice().into())?;

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
struct Payload {
    number: u32,
    timestamp: u64,
}

#[derive(Serialize)]
struct Response {
    number: u32,
    signature: String,
    serialized: String,
    timestamp: u64,
}

async fn generate_signed_number(
    State(signing_key): State<SigningKey>,
    Path(timestamp): Path<u64>,
) -> Result<Json<Response>, axum::http::StatusCode> {
    let number: u32 = rand::random();
    let payload = Payload { number, timestamp };

    let serialized = serde_json::to_string(&payload)
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    let signature: Signature = signing_key
        .try_sign(serialized.as_bytes())
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(Response {
        number,
        signature: signature.to_string(),
        serialized,
        timestamp,
    }))
}

async fn public_key(State(signing_key): State<SigningKey>) -> String {
    let public_key = signing_key.verifying_key();
    hex::encode(public_key.to_sec1_bytes())
}

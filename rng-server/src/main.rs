use axum::extract::Path;
use axum::Json;
use axum::{extract::State, routing::get, Router};
use clap::{Parser, Subcommand};
use hmac::{Hmac, Mac};
use k256::ecdsa::{signature::Signer, Signature, SigningKey};
use rand_core::{OsRng, RngCore};
use k256::sha2::Sha256;
use serde::Serialize;
use std::net::SocketAddr;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Serve web application
    Serve {
        #[clap(long, env = "RARE_EVO_BIND", default_value = "[::]:3000")]
        bind: SocketAddr,
        #[clap(long, env = "RARE_EVO_SIGNING_KEY")]
        signing_key: String,
        #[clap(long, env = "RARE_EVO_HMAC_SECRET")]
        hmac_secret: String,
    },
    /// Generate random keys
    Generate {},
}

#[derive(Clone)]
struct AppState {
    signing_key: SigningKey,
    hmac_template: Hmac<Sha256>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Serve {
            bind,
            signing_key,
            hmac_secret,
        } => {
            println!("Starting server on {bind}");
            let key_bytes = hex::decode(signing_key)?;
            let signing_key = SigningKey::from_bytes(key_bytes.as_slice().into())?;
            let hmac_key = hex::decode(hmac_secret)?;
            let hmac_template = Hmac::<Sha256>::new_from_slice(&hmac_key)
                .map_err(|_| anyhow::anyhow!("Failed to create HMAC instance from secret"))?;
            let state = AppState {
                signing_key,
                hmac_template,
            };
            let app = Router::new()
                .route("/number/{timestamp}", get(generate_signed_number))
                .route("/public-key", get(public_key))
                .route("/healthz", get(health))
                .with_state(state);
            let listener = tokio::net::TcpListener::bind(bind).await?;
            axum::serve(listener, app).await?;
            Ok(())
        }
        Commands::Generate {} => {
            let mut rng = OsRng;
            let key = SigningKey::random(&mut rng);
            let key = hex::encode_upper(key.to_bytes());
            const KEY_SIZE: usize = 20;
            let mut hmac_key = [0u8; KEY_SIZE];
            rng.fill_bytes(&mut hmac_key);
            let hmac_key = hex::encode_upper(hmac_key);
            eprintln!("Signing key: {key}");
            eprintln!("HMAC key: {hmac_key}");
            Ok(())
        },
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
    State(state): State<AppState>,
    Path(timestamp): Path<u64>,
) -> Result<Json<Response>, axum::http::StatusCode> {
    // Prevent precognition: only allow past or current timestamps
    let now_min = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?
        .as_secs()
        / 60;
    if timestamp > now_min {
        return Err(axum::http::StatusCode::NOT_FOUND);
    }

    let mut mac = state.hmac_template.clone();
    mac.update(&timestamp.to_be_bytes());
    let result = mac.finalize().into_bytes();
    // Take the first 4 bytes as a number
    let number: u32 = result[0..4]
        .try_into()
        .map(u32::from_be_bytes)
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
    let payload = Payload { number, timestamp };

    let serialized = serde_json::to_string(&payload)
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    let signature: Signature = state
        .signing_key
        .try_sign(serialized.as_bytes())
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(Response {
        number,
        signature: signature.to_string(),
        serialized,
        timestamp,
    }))
}

async fn public_key(State(state): State<AppState>) -> String {
    let public_key = state.signing_key.verifying_key();
    hex::encode(public_key.to_sec1_bytes())
}

async fn health() -> &'static str {
    "Healthy!"
}

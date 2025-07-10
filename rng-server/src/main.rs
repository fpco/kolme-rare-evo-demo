use axum::{routing::get, Router};
use clap::{Parser, Subcommand};
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

            let app = Router::new().route("/", get(root));

            let listener = tokio::net::TcpListener::bind(bind).await?;
            axum::serve(listener, app).await?;

            Ok(())
        }
    }
}

async fn root() -> &'static str {
    "Hello, World!"
}

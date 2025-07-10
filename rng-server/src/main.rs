use axum::{Router, routing::get};
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
        #[clap(long, env = "PORT", default_value = "[::]:3000")]
        port: SocketAddr,
    },
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Serve { port } => {
            println!("Starting server on {}", port);

            let app = Router::new().route("/", get(root));

            let listener = tokio::net::TcpListener::bind(port).await.unwrap();
            axum::serve(listener, app).await.unwrap();
        }
    }
}

async fn root() -> &'static str {
    "Hello, World!"
}

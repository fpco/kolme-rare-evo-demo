use kolme::{
    axum::{Json, Router, extract::State, routing::get},
    *,
};
use rust_decimal::prelude::Zero;

use crate::{
    app::GuessGame,
    indexer::{IndexerStateLock, LastWinner, LeaderboardEntry},
    time::GuessTimestamp,
};

/// Make an ApiServer that includes our app-specific /guess-game endpoint.
pub fn make_api_server(kolme: Kolme<GuessGame>, indexer: IndexerStateLock) -> ApiServer<GuessGame> {
    let route_state = RouteState {
        kolme: kolme.clone(),
        indexer,
    };
    ApiServer::new(kolme).with_extra_routes(make_extra_routes(route_state))
}

#[derive(Clone)]
struct RouteState {
    kolme: Kolme<GuessGame>,
    indexer: IndexerStateLock,
}

fn make_extra_routes(route_state: RouteState) -> Router {
    Router::new()
        .route("/guess-game", get(guess_game_data))
        .with_state(route_state)
}

/// Data returned from the /guess-game endpoint.
#[derive(serde::Serialize)]
struct GuessGameData {
    /// When the current round of betting will finish.
    current_round_finishes: Timestamp,
    /// Sum total of the current bets for this round of betting.
    current_bets: Decimal,
    /// The last settled round.
    last_winner: Option<LastWinner>,
    /// The top 10 participants of all time.
    leaderboard: Vec<LeaderboardEntry>,
}

async fn guess_game_data(State(route_state): State<RouteState>) -> Json<GuessGameData> {
    let RouteState { kolme, indexer } = route_state;
    let indexer_state = indexer.read().await;
    let current_round = GuessTimestamp::after(Timestamp::now());
    Json(GuessGameData {
        current_round_finishes: current_round.into(),
        current_bets: kolme
            .read()
            .get_app_state()
            .pending_wagers
            .get(&current_round)
            .map_or_else(Decimal::zero, |wagers| {
                wagers.iter().map(|w| w.amount).sum()
            }),
        last_winner: indexer_state.last_winner.clone(),
        leaderboard: indexer_state.leaderboard.clone(),
    })
}

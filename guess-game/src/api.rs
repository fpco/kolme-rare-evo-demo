use std::collections::HashMap;

use anyhow::{Context, Result};
use kolme::{
    axum::{Json, Router, extract::State, response::IntoResponse, routing::get},
    *,
};
use reqwest::StatusCode;
use rust_decimal::prelude::Zero;

use crate::{
    app::{GuessGame, GuessGameLog},
    state::LastWinner,
    time::GuessTimestamp,
};

pub fn make_api_server(kolme: Kolme<GuessGame>) -> ApiServer<GuessGame> {
    ApiServer::new(kolme.clone()).with_extra_routes(make_extra_routes(kolme.clone()))
}

fn make_extra_routes(kolme: Kolme<GuessGame>) -> Router {
    Router::new()
        .route(
            "/guess-game",
            get(|kolme| async {
                guess_game_data(kolme).await.map_err(|e| {
                    let mut res = e.to_string().into_response();
                    *res.status_mut() = StatusCode::INTERNAL_SERVER_ERROR;
                    res
                })
            }),
        )
        .with_state(kolme)
}

#[derive(serde::Serialize)]
struct GuessGameData {
    current_round_finishes: Timestamp,
    current_bets: Decimal,
    last_winner: Option<LastWinner>,
    leaderboard: Vec<LeaderboardEntry>,
}

#[derive(serde::Serialize)]
struct LeaderboardEntry {
    account: AccountId,
    winnings: Decimal,
}

async fn guess_game_data(State(kolme): State<Kolme<GuessGame>>) -> Result<Json<GuessGameData>> {
    let current_round = GuessTimestamp::after(Timestamp::now());
    Ok(Json(GuessGameData {
        current_round_finishes: current_round.try_into()?,
        current_bets: kolme
            .read()
            .get_app_state()
            .pending_wagers
            .get(&current_round)
            .map_or_else(Decimal::zero, |wagers| {
                wagers.iter().map(|w| w.amount).sum()
            }),
        last_winner: kolme.read().get_app_state().last_winner.clone(),
        leaderboard: leaderboard(&kolme).await?,
    }))
}

// It's really inefficient to process every block on each request.
// But we can still do it! Caching or using a database would all be
// improvements.
async fn leaderboard(kolme: &Kolme<GuessGame>) -> Result<Vec<LeaderboardEntry>> {
    let mut totals = HashMap::<AccountId, Decimal>::new();
    for height in BlockHeight::start().0..kolme.read().get_next_height().0 {
        let height = BlockHeight(height);
        let block = kolme
            .get_block(height)
            .await?
            .context("Missing an expected block")?;
        for logs in &*block.logs {
            for log in logs {
                match serde_json::from_str(log) {
                    Err(_) => continue,
                    Ok(GuessGameLog::Winnings { winner, amount }) => {
                        *totals.entry(winner).or_default() += amount;
                    }
                }
            }
        }
    }

    let mut winners = totals
        .into_iter()
        .map(|(account, winnings)| LeaderboardEntry { account, winnings })
        .collect::<Vec<_>>();
    winners.sort_by(|x, y| y.winnings.cmp(&x.winnings));
    Ok(winners.into_iter().take(10).collect())
}

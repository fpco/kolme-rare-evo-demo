use std::collections::BTreeMap;

use kolme::{
    axum::{
        Json, Router,
        extract::{Path, State},
        routing::get,
    },
    *,
};
use rust_decimal::prelude::Zero;

use crate::{
    app::{ASSET_ID, GuessGame},
    indexer::{IndexerStateLock, LeaderboardEntry, RoundResults},
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
        .route("/guess-game/{pubkey}", get(account_data))
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

#[derive(serde::Serialize, Debug, Clone, PartialEq, Eq)]
struct LastWinner {
    finished: Timestamp,
    number: u8,
    winnings: BTreeMap<AccountId, Decimal>,
}

async fn guess_game_data(State(route_state): State<RouteState>) -> Json<GuessGameData> {
    let RouteState { kolme, indexer } = route_state;
    let indexer_state = indexer.read().await;
    let current_round = GuessTimestamp::after(Timestamp::now());
    let last_winner = indexer_state.results.last_key_value().map(
        |(finished, RoundResults { number, winnings })| LastWinner {
            finished: finished.into(),
            number: *number,
            winnings: winnings.clone(),
        },
    );
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
        last_winner,
        leaderboard: indexer_state.leaderboard.clone(),
    })
}

#[derive(serde::Serialize)]
struct AccountData {
    funds: Decimal,
    bet_history: BTreeMap<Timestamp, BTreeMap<u8, Decimal>>,
}

async fn account_data(
    State(route_state): State<RouteState>,
    Path(pubkey): Path<PublicKey>,
) -> Json<AccountData> {
    let kolme_r = route_state.kolme.read();
    let Some((account_id, account)) = kolme_r
        .get_framework_state()
        .get_accounts()
        .get_account_for_key(pubkey)
    else {
        return Json(AccountData {
            funds: Decimal::ZERO,
            bet_history: BTreeMap::new(),
        });
    };
    let funds = account
        .get_assets()
        .get(&ASSET_ID)
        .cloned()
        .unwrap_or_default();
    let bet_history = route_state
        .indexer
        .read()
        .await
        .user_bet_history
        .get(&account_id)
        .map_or_else(BTreeMap::new, |orig| {
            orig.iter()
                .map(|(timestamp, guesses)| (timestamp.into(), guesses.clone()))
                .collect()
        });
    Json(AccountData { funds, bet_history })
}

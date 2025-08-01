use std::{
    collections::{BTreeMap, HashMap},
    sync::Arc,
};

use anyhow::Result;
use kolme::*;
use tokio::sync::RwLock;

use crate::{
    app::{GuessGame, GuessGameLog},
    time::GuessTimestamp,
};

pub type IndexerStateLock = Arc<RwLock<IndexerState>>;

#[derive(Default, Clone)]
pub struct IndexerState {
    pub leaderboard: Vec<LeaderboardEntry>,
    pub total_winnings: HashMap<AccountId, Decimal>,
    pub user_bet_history: HashMap<AccountId, BTreeMap<GuessTimestamp, BTreeMap<u8, Decimal>>>,
    pub results: BTreeMap<GuessTimestamp, RoundResults>,
}

#[derive(serde::Serialize, Debug, Clone, PartialEq, Eq)]
pub struct RoundResults {
    pub number: u8,
    pub winnings: BTreeMap<AccountId, Decimal>,
}

#[derive(serde::Serialize, Clone, Copy)]
pub struct LeaderboardEntry {
    pub account: AccountId,
    pub winnings: Decimal,
}

pub struct Indexer {
    kolme: Kolme<GuessGame>,
    state: IndexerStateLock,
}

impl Indexer {
    pub fn new(kolme: Kolme<GuessGame>) -> Self {
        Indexer {
            kolme,
            state: Arc::new(RwLock::new(IndexerState::default())),
        }
    }

    pub fn get_state(&self) -> &IndexerStateLock {
        &self.state
    }

    pub async fn run(self) -> Result<()> {
        todo!()
    }

    async fn run_once(&self, height: BlockHeight) -> Result<IndexerState> {
        let block = self.kolme.wait_for_block(height).await?;
        let logs = self.kolme.load_logs(block.as_inner().logs).await?;
        let mut state = (*self.state.read().await).clone();
        update(&mut state, &logs);
        Ok(state)
    }
}

fn update(state: &mut IndexerState, logs: &[Vec<String>]) {
    for log in logs.iter().flat_map(|v| v.iter()) {
        if let Ok(log) = serde_json::from_str::<GuessGameLog>(log) {
            match log {
                GuessGameLog::Wager {
                    account,
                    timestamp,
                    guess,
                    amount,
                } => {
                    *state
                        .user_bet_history
                        .entry(account)
                        .or_default()
                        .entry(timestamp)
                        .or_default()
                        .entry(guess)
                        .or_default() += amount;
                }
                GuessGameLog::NewWinner { finished, number } => {
                    let old = state.results.insert(
                        finished,
                        RoundResults {
                            number,
                            winnings: BTreeMap::new(),
                        },
                    );
                    assert_eq!(old, None);
                }
                GuessGameLog::Winnings {
                    winner,
                    amount,
                    finished,
                } => {
                    *state.total_winnings.entry(winner).or_default() += amount;
                    let old = state
                        .results
                        .get_mut(&finished)
                        .expect("Logic error: NewWinner must come before Winnings")
                        .winnings
                        .insert(winner, amount);
                    assert_eq!(old, None);
                }
            }
        }
    }

    let mut winners = state
        .total_winnings
        .iter()
        .map(|(account, winnings)| LeaderboardEntry {
            account: *account,
            winnings: *winnings,
        })
        .collect::<Vec<_>>();
    winners.sort_by(|x, y| y.winnings.cmp(&x.winnings));
    state.leaderboard = winners.into_iter().take(10).collect();
}

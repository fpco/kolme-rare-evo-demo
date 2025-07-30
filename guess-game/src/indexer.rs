use std::{
    collections::{BTreeMap, HashMap},
    sync::Arc,
};

use anyhow::{Context, Result};
use kolme::*;
use tokio::sync::RwLock;

use crate::app::{GuessGame, GuessGameLog};

pub type IndexerStateLock = Arc<RwLock<IndexerState>>;

#[derive(Default, Clone)]
pub struct IndexerState {
    pub last_winner: Option<LastWinner>,
    pub leaderboard: Vec<LeaderboardEntry>,
    pub total_winnings: HashMap<AccountId, Decimal>,
}

#[derive(serde::Serialize, Debug, Clone, PartialEq, Eq)]
pub struct LastWinner {
    pub finished: Timestamp,
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
        let mut next_to_index = BlockHeight::start();
        loop {
            match self.run_once(next_to_index).await {
                Err(e) => {
                    eprintln!("Error while updating indexer for height {next_to_index}: {e}");
                }
                Ok(state) => {
                    *self.state.write().await = state;
                    next_to_index = next_to_index.next();
                }
            }
        }
    }

    async fn run_once(&self, height: BlockHeight) -> Result<IndexerState> {
        let block = self.kolme.wait_for_block(height).await?;
        let logs = self.kolme.load_logs(block.as_inner().logs).await?;
        let mut state = (*self.state.read().await).clone();
        update(&mut state, &logs)?;
        Ok(state)
    }
}

fn update(state: &mut IndexerState, logs: &[Vec<String>]) -> Result<()> {
    let mut new_winner = None;
    for log in logs.iter().flat_map(|v| v.iter()) {
        if let Ok(log) = serde_json::from_str::<GuessGameLog>(log) {
            match log {
                GuessGameLog::NewWinner { finished, number } => {
                    assert_eq!(new_winner, None);
                    new_winner = Some(LastWinner {
                        finished: finished.try_into()?,
                        number,
                        winnings: BTreeMap::new(),
                    });
                }
                GuessGameLog::Winnings { winner, amount } => {
                    *state.total_winnings.entry(winner).or_default() += amount;

                    let new_winner = new_winner
                        .as_mut()
                        .context("update: impossible None for new_winner")?;
                    let old = new_winner.winnings.insert(winner, amount);
                    assert_eq!(old, None);
                }
            }
        }
    }

    if new_winner.is_some() {
        state.last_winner = new_winner;
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

    Ok(())
}

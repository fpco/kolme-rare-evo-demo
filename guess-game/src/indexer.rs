use std::sync::Arc;

use anyhow::Result;
use kolme::*;

pub struct Indexer<App: KolmeApp, Store> {
    kolme: Kolme<App>,
    store: Store,
}

pub trait IndexerStore {
    async fn next_to_index(&mut self) -> Result<BlockHeight>;
    async fn add_block<AppMessage>(
        &mut self,
        block: &SignedBlock<AppMessage>,
        logs: &[Vec<String>],
    ) -> Result<()>;
}

pub struct IndexerMemoryStore<State> {
    next_to_index: BlockHeight,
    state: Arc<parking_lot::RwLock<Arc<State>>>,
}

impl<State> IndexerStore for IndexerMemoryStore<State> {
    async fn next_to_index(&mut self) -> Result<BlockHeight> {
        Ok(self.next_to_index)
    }

    async fn add_block<AppMessage>(
        &mut self,
        block: &SignedBlock<AppMessage>,
        logs: &[Vec<String>],
    ) -> Result<()> {
        anyhow::ensure!(self.next_to_index == block.height());
        let mut state = Arc::unwrap_or_clone(self.state.read().clone());
        state.add_block(block, logs).await?;
        *self.state.write() = Arc::new(state);
        self.next_to_index = self.next_to_index.next();
        Ok(())
    }
}

pub trait IndexerState<App: KolmeApp> {
    async fn add_block(
        &mut self,
        block: &SignedBlock<App::Message>,
        logs: &[Vec<String>],
    ) -> Result<()>;
}

impl<App, Store> Indexer<App, Store> {}

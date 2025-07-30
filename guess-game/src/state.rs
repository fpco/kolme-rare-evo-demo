use std::collections::BTreeMap;

use kolme::*;

use crate::time::GuessTimestamp;

#[derive(Debug, Clone)]
pub struct GuessState {
    pub rng_public_key: PublicKey,
    pub received_funds: MerkleMap<AccountId, BlockHeight>,
    pub pending_wagers: MerkleMap<GuessTimestamp, MerkleVec<Wager>>,
    pub last_winner: Option<LastWinner>,
}

#[derive(Debug, Clone)]
pub struct Wager {
    pub account: AccountId,
    pub guess: u8,
    pub amount: Decimal,
}

impl MerkleSerialize for GuessState {
    fn merkle_serialize(
        &self,
        serializer: &mut kolme::MerkleSerializer,
    ) -> Result<(), kolme::MerkleSerialError> {
        let Self {
            rng_public_key,
            received_funds,
            pending_wagers,
            last_winner,
        } = self;
        serializer.store(rng_public_key)?;
        serializer.store(received_funds)?;
        serializer.store(pending_wagers)?;
        serializer.store(last_winner)?;
        Ok(())
    }
}

impl MerkleDeserialize for GuessState {
    fn merkle_deserialize(
        deserializer: &mut kolme::MerkleDeserializer,
        _version: usize,
    ) -> Result<Self, kolme::MerkleSerialError> {
        Ok(Self {
            rng_public_key: deserializer.load()?,
            received_funds: deserializer.load()?,
            pending_wagers: deserializer.load()?,
            last_winner: deserializer.load()?,
        })
    }
}

impl MerkleSerialize for Wager {
    fn merkle_serialize(&self, serializer: &mut MerkleSerializer) -> Result<(), MerkleSerialError> {
        let Self {
            account,
            guess,
            amount,
        } = self;
        serializer.store(account)?;
        serializer.store(guess)?;
        serializer.store(amount)?;
        Ok(())
    }
}

impl MerkleDeserialize for Wager {
    fn merkle_deserialize(
        deserializer: &mut MerkleDeserializer,
        _version: usize,
    ) -> Result<Self, MerkleSerialError> {
        Ok(Self {
            account: deserializer.load()?,
            guess: deserializer.load()?,
            amount: deserializer.load()?,
        })
    }
}

#[derive(serde::Serialize, Debug, Clone)]
pub struct LastWinner {
    pub finished: Timestamp,
    pub number: u8,
    pub winnings: BTreeMap<AccountId, Decimal>,
}

impl MerkleSerialize for LastWinner {
    fn merkle_serialize(&self, serializer: &mut MerkleSerializer) -> Result<(), MerkleSerialError> {
        let Self {
            finished,
            number,
            winnings,
        } = self;
        serializer.store(finished)?;
        serializer.store(number)?;
        serializer.store(winnings)?;
        Ok(())
    }
}

impl MerkleDeserialize for LastWinner {
    fn merkle_deserialize(
        deserializer: &mut MerkleDeserializer,
        _version: usize,
    ) -> Result<Self, MerkleSerialError> {
        Ok(Self {
            finished: deserializer.load()?,
            number: deserializer.load()?,
            winnings: deserializer.load()?,
        })
    }
}

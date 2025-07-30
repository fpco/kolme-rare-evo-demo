use std::fmt::Display;

use kolme::*;

/// A guess timestamp, which is minutes from the epoch.
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
pub struct GuessTimestamp(u64);

impl ToMerkleKey for GuessTimestamp {
    fn to_merkle_key(&self) -> MerkleKey {
        self.0.to_merkle_key()
    }
}

impl FromMerkleKey for GuessTimestamp {
    fn from_merkle_key(bytes: &[u8]) -> Result<Self, MerkleSerialError> {
        u64::from_merkle_key(bytes).map(Self)
    }
}

impl GuessTimestamp {
    /// Find the next guess timestamp after the given timestamp.
    ///
    /// Panics if given a timestamp from before the Unix epoch.
    pub fn after(timestamp: Timestamp) -> Self {
        GuessTimestamp(
            u64::try_from(timestamp.as_second())
                .expect("GuessTimestamp::after: received timestamp from before the epoch")
                / 60
                + 1,
        )
    }
}

impl Display for GuessTimestamp {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

impl TryFrom<&GuessTimestamp> for Timestamp {
    type Error = anyhow::Error;

    fn try_from(
        GuessTimestamp(minutes): &GuessTimestamp,
    ) -> std::result::Result<Self, Self::Error> {
        let seconds = minutes * 60;
        Ok(Timestamp::from_second(i64::try_from(seconds)?)?)
    }
}

impl TryFrom<GuessTimestamp> for Timestamp {
    type Error = anyhow::Error;

    fn try_from(value: GuessTimestamp) -> Result<Self, Self::Error> {
        Timestamp::try_from(&value)
    }
}

impl TryFrom<i64> for GuessTimestamp {
    type Error = anyhow::Error;

    fn try_from(value: i64) -> std::result::Result<Self, Self::Error> {
        Ok(GuessTimestamp(u64::try_from(value)?))
    }
}

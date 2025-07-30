use anyhow::Result;
use kolme::*;
use reqwest::Url;

use crate::time::GuessTimestamp;

pub struct RngServer {
    client: reqwest::Client,
    rng_server_url: Url,
    rng_public_key: PublicKey,
}

impl RngServer {
    pub async fn new(rng_server_url: &Url, rng_public_key: PublicKey) -> Result<Self> {
        let client = reqwest::Client::new();
        keycheck(&client, rng_server_url, rng_public_key).await?;
        Ok(RngServer {
            client,
            rng_server_url: rng_server_url.clone(),
            rng_public_key,
        })
    }

    pub(crate) async fn get_result(
        &self,
        guess_timestamp: GuessTimestamp,
    ) -> Result<SignedTaggedJson<RngResult>> {
        #[derive(serde::Deserialize)]
        struct NumberRes {
            signature: Signature,
            serialized: String,
            recovery_id: RecoveryId,
        }
        let NumberRes {
            signature,
            serialized,
            recovery_id,
        } = self
            .client
            .get(
                self.rng_server_url
                    .join("number/")?
                    .join(&guess_timestamp.to_string())?,
            )
            .send()
            .await?
            .error_for_status()?
            .json()
            .await?;
        let signed = SignedTaggedJson::<RngResult> {
            message: TaggedJson::try_from_string(serialized)?,
            signature,
            recovery_id,
        };
        anyhow::ensure!(signed.verify_signature()? == self.rng_public_key);
        Ok(signed)
    }
}

/// Check that we have the correct public key/RNG server combo.
async fn keycheck(
    client: &reqwest::Client,
    rng_server: &Url,
    rng_public_key: PublicKey,
) -> Result<()> {
    let actual_public_key: PublicKey = client
        .get(rng_server.join("public-key")?)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    if rng_public_key == actual_public_key {
        println!("Confirmed RNG server is using expected public key {rng_public_key}");
        Ok(())
    } else {
        Err(anyhow::anyhow!(
            "Public key mismatch: expected {rng_public_key}, but got {actual_public_key}"
        ))
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq, Eq, Clone)]
pub struct RngResult {
    pub number: u32,
    pub timestamp: i64,
}

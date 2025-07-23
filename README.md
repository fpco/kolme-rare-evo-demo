# FP Block Kolme Demo - RareEvo 2025

This repo contains a sample application using [Kolme](https://kolme.fpblock.com). It is the complete codebase for a live coding demo by [FP Block](https://www.fpblock.com) for [RareEvo 2025](https://rareevo.io/). The demo is a simple application designed to demonstrate the some of the abilities of Kolme, namely:

* Ingestion of off-chain data
* Unbounded CPU time computations
* Running a blockchain and supporting services in a single executable

The demo app is a simple number guessing game. Users can request funds, place bets on what the next random number will be, and the closest guess will win the pot. This repo consists of three components:

* A helper service, `rng-server`, which produces a new cryptographically signed random number every minute.
* The `guess-game`, the actual Kolme application.
* A frontend to interact with the Kolme application.

## Prerequisites

* Install the [Rust toolchain](https://www.rust-lang.org/learn/get-started)

## Running locally

The following are full steps to run the application locally. Instead of using `justfile` recipes, this includes the raw commands and key generation to better explain the full process.

1.  Generate random keys for the `rng-server`:

    ```shellsession
    cargo run --bin rng-server generate
    ```

    You should receive output like the following:

    ```
    Signing key: B9FAB6F9901F986AEA98FB5E040332B9A562B040D6BC86D2ACC15D677E52E21E
    HMAC key: C882DF047C178265CCF0430434039C55CE1DD085
    ```

2.  Run the `rng-server` on port 3001 with the generated keys:

    ```shellsession
    cargo run --bin rng-server serve \
      --bind '0.0.0.0:3001' \
      --signing-key B9FAB6F9901F986AEA98FB5E040332B9A562B040D6BC86D2ACC15D677E52E21E \
      --hmac-secret C882DF047C178265CCF0430434039C55CE1DD085
    ```

3.  Request the public key from the RNG server:

    ```shellsession
    curl http://localhost:3001/public-key
    ```

    You should receive output like the following:

    ```
    "02c5b31a0cd0f505cc436c14c0bf9159411bd9e388b20e6de34974d451eba9117e"
    ```

4.  Generate a Kolme validator keypair:

    ```shellsession
    cargo run --bin guess-game gen-keypair
    ```

    You should receive output like the following:

    ```
    Public key: 03fb33d847f270add3b8f2e3cd3dfa178453a457425ced150d1181844093071a29
    Secret key: 23e9a5b08ef2670deb28a43b2651232bbef94054afe64a0876f7cda5aab190f0
    ```

5.  Launch the Kolme guessing game app:

    ```shellsession
    cargo run --bin guess-game serve \
      --rng-server http://127.0.0.1:3001 \
      --rng-public-key 02c5b31a0cd0f505cc436c14c0bf9159411bd9e388b20e6de34974d451eba9117e \
      --validator-secret-key 23e9a5b08ef2670deb28a43b2651232bbef94054afe64a0876f7cda5aab190f0
    ```

TODO: Add instructions for launching the frontend, and maybe include instructions for using the Kolme CLI for direct interaction.

# Rng server module
mod rng './rng-server/justfile'
mod game './guess-game/justfile'

# List all recipes
default:
    just --list --unsorted

# Compile project
cargo-compile:
    cargo test --workspace --no-run --locked

# Clippy check
cargo-clippy-check:
    cargo clippy --no-deps --workspace --locked --tests --benches --examples -- -Dwarnings

# Fmt check
cargo-fmt-check:
    cargo fmt --all --check

# Format all
fmt:
    cargo fmt --all

# Test
cargo-test:
    cargo nextest run --workspace --locked --no-tests pass

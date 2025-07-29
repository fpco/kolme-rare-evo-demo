FROM alpine:3.21

ADD --chmod=755 https://github.com/fpco/health-check/releases/download/v0.7.0/health-check-aarch64-unknown-linux-musl /usr/bin/health-check

COPY guess-game /usr/bin/guess-game

ENTRYPOINT [ "health-check" ]

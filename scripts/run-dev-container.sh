#!/usr/bin/env bash
# Run gijirog in Docker with secrets fetched from AWS SSM Parameter Store.
# Secrets live only in process memory and are passed to the container at launch.
#
# Build the image first:
#   docker build -t gijirog:dev .
#
# Set AWS_PROFILE to whichever SSO profile has access to /gijirog/dev/* before
# running. Override SSM_PREFIX or IMAGE if needed.
set -euo pipefail

PREFIX="${SSM_PREFIX:-/gijirog/dev}"
IMAGE="${IMAGE:-gijirog:dev}"

DISCORD_TOKEN=$(aws ssm get-parameter \
  --name "${PREFIX}/DISCORD_TOKEN" \
  --with-decryption \
  --query Parameter.Value \
  --output text)

DISCORD_GUILD_ID=$(aws ssm get-parameter \
  --name "${PREFIX}/DISCORD_GUILD_ID" \
  --query Parameter.Value \
  --output text)

export DISCORD_TOKEN DISCORD_GUILD_ID

exec docker run --rm \
  -e DISCORD_TOKEN \
  -e DISCORD_GUILD_ID \
  "$IMAGE" "$@"

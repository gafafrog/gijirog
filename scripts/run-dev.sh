#!/usr/bin/env bash
# Run gijirog locally with secrets fetched from AWS SSM Parameter Store.
# Secrets live only in process memory — nothing is written to disk.
#
# Set AWS_PROFILE to whichever SSO profile has access to /gijirog/dev/* before
# running. Override SSM_PREFIX if your parameter path differs.
set -euo pipefail

PREFIX="${SSM_PREFIX:-/gijirog/dev}"

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

exec uv run gijirog "$@"

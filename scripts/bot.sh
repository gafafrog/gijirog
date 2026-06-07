#!/usr/bin/env bash
# Start/stop the gijirog bot on ECS by flipping the service's desired count.
#
# The service's resting state is 0 (declared in CDK) — it is off until you
# raise it for a meeting, then lower it again afterwards. This is the runtime
# lever; deploys reconcile back to the resting 0.
#
#   ./scripts/bot.sh up       # desired-count 1 — bot comes online (~30-60s)
#   ./scripts/bot.sh down     # desired-count 0 — bot goes offline
#   ./scripts/bot.sh status   # show desired/running counts
#
# Set AWS_PROFILE to an SSO profile allowed to update the service. Override
# REGION / CLUSTER / SERVICE if your deployment differs.
set -euo pipefail

REGION="${AWS_REGION:-us-west-2}"
CLUSTER="${CLUSTER:-gijirog}"
SERVICE="${SERVICE:-gijirog}"

usage() {
  echo "usage: $0 {up|down|status}" >&2
  exit 2
}

set_count() {
  aws ecs update-service \
    --region "$REGION" \
    --cluster "$CLUSTER" \
    --service "$SERVICE" \
    --desired-count "$1" \
    --query 'service.{desired:desiredCount,running:runningCount}' \
    --output table
}

status() {
  aws ecs describe-services \
    --region "$REGION" \
    --cluster "$CLUSTER" \
    --services "$SERVICE" \
    --query 'services[0].{desired:desiredCount,running:runningCount}' \
    --output table
}

case "${1:-}" in
  up)     set_count 1; echo "Bot starting — give it ~30-60s, then check Discord." ;;
  down)   set_count 0; echo "Bot stopping." ;;
  status) status ;;
  *)      usage ;;
esac

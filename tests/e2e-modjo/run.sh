#!/usr/bin/env bash
# Run the e2e-modjo regression suite against any environment.
#
# Usage:
#   ./run.sh                                # default = local docker compose
#   ./run.sh staging                        # uses preset env from below
#   ./run.sh prod                           # idem
#   API_URL=https://api.example.com ./run.sh
#
# Env knobs (override individually if needed):
#   API_URL              http://localhost:4200
#   FILES_URL            http://localhost:4292
#   HASURA_URL           http://localhost:4201
#   HASURA_ADMIN_SECRET  admin                 (only used by smoke.test.js
#                                                introspection)
#
# Notes:
#  - The tests create test data (alerts, messages, geoloc points). They use
#    UUIDs to stay isolated, but they DO write to the targeted database.
#    Keep that in mind before pointing at prod.
#  - HASURA_ADMIN_SECRET is only needed for the introspection smoke check.
#    If unavailable in prod, set ALLOW_HASURA_ADMIN_SKIP=1 to skip that test.

set -euo pipefail

ENV="${1:-local}"

case "$ENV" in
  local)
    : "${API_URL:=http://localhost:4200}"
    : "${FILES_URL:=http://localhost:4292}"
    : "${HASURA_URL:=http://localhost:4201}"
    : "${HASURA_ADMIN_SECRET:=admin}"
    ;;
  staging)
    : "${API_URL:?set API_URL for staging}"
    : "${FILES_URL:?set FILES_URL for staging}"
    : "${HASURA_URL:?set HASURA_URL for staging}"
    ;;
  prod)
    : "${API_URL:?set API_URL for prod}"
    : "${FILES_URL:?set FILES_URL for prod}"
    : "${HASURA_URL:?set HASURA_URL for prod}"
    ;;
  *)
    echo "Unknown env preset: $ENV (use: local, staging, prod)" >&2
    exit 2
    ;;
esac

export API_URL FILES_URL HASURA_URL HASURA_ADMIN_SECRET

cd "$(dirname "$0")"

echo "[e2e-modjo] target environment: $ENV"
echo "  API_URL    = $API_URL"
echo "  FILES_URL  = $FILES_URL"
echo "  HASURA_URL = $HASURA_URL"
echo

# Quick reachability check first — fail fast with a clear error.
if ! curl -sS -m 5 -o /dev/null -w '%{http_code}' "$API_URL/api/v1/spec" | grep -qE '^(200|301|302)$'; then
  echo "[e2e-modjo] API_URL unreachable: $API_URL" >&2
  exit 3
fi

exec node --test --test-reporter=spec .

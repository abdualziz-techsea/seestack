#!/usr/bin/env bash
# Runs the seeStack JavaScript SDK example against the seeded demo
# project, printing what each captured exception sent back.
#
# Usage:
#   ./run-sdk-demo.sh
#
# Requires ./run-demo.sh to have started the stack (so
# scripts/.demo-api-key exists) and Node.js on the PATH.

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEY_FILE="$HERE/scripts/.demo-api-key"
BACKEND="${SEESTACK_BACKEND:-http://localhost:8082}"

if [ ! -s "$KEY_FILE" ]; then
  echo "Demo ingest key not found. Run ./run-demo.sh first." >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to run the SDK demo." >&2
  exit 1
fi

export SEESTACK_API_KEY="$(cat "$KEY_FILE")"
export SEESTACK_ENDPOINT="$BACKEND"

printf "\nseeStack JavaScript SDK demo\n"
printf "  endpoint : %s\n"  "$SEESTACK_ENDPOINT"
printf "  api key  : %s…\n" "${SEESTACK_API_KEY:0:12}"
printf "\n"

node "$HERE/sdks/examples/example-app.js"

printf "\nOpen %s/errors in the dashboard to see the events.\n" "http://localhost:3002"

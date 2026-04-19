#!/usr/bin/env bash
# Fires a fresh error at the seeded demo project.
#
# Usage:
#   scripts/generate-test-error.sh [exception-class] [message]
#
# Requires scripts/seed-demo.sh to have already run at least once
# (that's what writes the raw ingest key to scripts/.demo-api-key).

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="${SEESTACK_BACKEND:-http://localhost:8080}"

if [ ! -s "$HERE/.demo-api-key" ]; then
  echo "No demo ingest key cached." >&2
  echo "Run ./run-demo.sh (or scripts/seed-demo.sh) first." >&2
  exit 1
fi

API_KEY="$(cat "$HERE/.demo-api-key")"
CLASS="${1:-RuntimeException}"
MESSAGE="${2:-Test error generated at $(date '+%Y-%m-%dT%H:%M:%S')}"

payload=$(python3 - <<PY
import json
print(json.dumps({
    "exceptionClass": "$CLASS",
    "message": """$MESSAGE""",
    "stackTrace": [
        "at com.demo.DemoEndpoint.handle(DemoEndpoint.java:42)",
        "at com.demo.Application.main(Application.java:12)",
    ],
    "level": "error",
    "environment": "production",
    "release": "1.0.0",
    "metadata": {"source": "generate-test-error.sh"},
}))
PY
)

http_code=$(curl -s -o /tmp/seestack-test-error.body -w "%{http_code}" \
  -X POST "$BACKEND/ingest/v1/errors" \
  -H "Content-Type: application/json" \
  -H "X-SeeStack-Key: $API_KEY" \
  -d "$payload")

if [ "$http_code" = "202" ]; then
  id=$(python3 -c 'import json,sys;print(json.load(open("/tmp/seestack-test-error.body"))["data"]["id"])' 2>/dev/null || echo '?')
  echo "OK — sent $CLASS (event id $id)"
  echo "Visit http://localhost:3000/errors to see it."
else
  echo "FAIL — HTTP $http_code" >&2
  cat /tmp/seestack-test-error.body >&2
  exit 1
fi

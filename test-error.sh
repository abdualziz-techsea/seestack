#!/usr/bin/env bash
# Sends a single real error to the seeded demo project.
#
# Usage:
#   ./test-error.sh                         # random default
#   ./test-error.sh "ClassName" "message"   # custom
#
# Requires that ./run-demo.sh has already started the stack (which
# seeds scripts/.demo-api-key).

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$HERE/scripts/generate-test-error.sh" "$@"

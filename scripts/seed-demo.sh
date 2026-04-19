#!/usr/bin/env bash
# Seeds the demo account + project + sample errors + monitors.
# Idempotent — safe to re-run.
#
# Writes two files consumed by other scripts and by the demo banner:
#   scripts/.demo-state           (KEY=VALUE env file)
#   scripts/.demo-api-key         (raw ingest key, one-line)

set -euo pipefail

BACKEND="${SEESTACK_BACKEND:-http://localhost:8080}"
EMAIL="${DEMO_EMAIL:-demo@seestack.local}"
PASSWORD="${DEMO_PASSWORD:-Demo@12345}"
NAME="${DEMO_NAME:-seeStack Demo}"
PROJECT_NAME="${DEMO_PROJECT_NAME:-seeStack Demo Project}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE="$HERE/.demo-state"
KEY_FILE="$HERE/.demo-api-key"

say() { printf "  %s\n" "$*"; }

wait_up() {
  local url="$1" i=0
  until curl -fs "$url" >/dev/null 2>&1; do
    i=$((i+1))
    if [ "$i" -gt 120 ]; then
      echo "timed out waiting for $url" >&2
      return 1
    fi
    sleep 1
  done
}

say "Waiting for backend at $BACKEND ..."
wait_up "$BACKEND/actuator/health"

# ── 1. register (ignore 409 if exists) ─────────────────────────────
register_resp="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}" || true)"
case "$register_resp" in
  201) say "Created demo user ($EMAIL)." ;;
  409) say "Demo user already exists — reusing." ;;
  *)   echo "register failed: HTTP $register_resp" >&2; exit 1 ;;
esac

# ── 2. login for the JWT ───────────────────────────────────────────
login_body="$(curl -fs -X POST "$BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
TOKEN="$(printf '%s' "$login_body" | python3 -c 'import json,sys; print(json.loads(sys.stdin.read())["data"]["token"])')"
say "Logged in — got demo JWT."

# ── 3. ensure a project named $PROJECT_NAME exists ─────────────────
existing="$(curl -fs -H "Authorization: Bearer $TOKEN" "$BACKEND/api/v1/projects")"
PROJECT_ID="$(printf '%s' "$existing" | python3 -c "
import json, sys
d = json.loads(sys.stdin.read())['data']
want = '$PROJECT_NAME'
m = [p for p in d if p['name'] == want]
print(m[0]['id'] if m else '')")"

if [ -z "$PROJECT_ID" ]; then
  create_body="$(curl -fs -X POST "$BACKEND/api/v1/projects" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$PROJECT_NAME\",\"platform\":\"node\"}")"
  PROJECT_ID="$(printf '%s' "$create_body" | python3 -c 'import json,sys;print(json.loads(sys.stdin.read())["data"]["id"])')"
  API_KEY="$(printf '%s' "$create_body" | python3 -c 'import json,sys;print(json.loads(sys.stdin.read())["data"]["apiKey"])')"
  say "Created demo project + ingest key."
  printf '%s\n' "$API_KEY" > "$KEY_FILE"
else
  say "Demo project already exists."
fi

# Delete the auto-provisioned "My First Project" if it exists alongside the
# demo project, so the dashboard opens directly on the seeded data.
stray_id="$(printf '%s' "$existing" | python3 -c "
import json, sys
d = json.loads(sys.stdin.read())['data']
m = [p for p in d if p['name'] == 'My First Project']
print(m[0]['id'] if m else '')" 2>/dev/null || true)"
if [ -n "$stray_id" ] && [ "$stray_id" != "$PROJECT_ID" ]; then
  curl -fs -o /dev/null -X DELETE -H "Authorization: Bearer $TOKEN" "$BACKEND/api/v1/projects/$stray_id" || true
  say "Removed auto-created 'My First Project'."
fi

# If we have an existing project but no stored key file, we can't recover the
# raw key (only the hash is stored). Print a note so the demo banner handles it.
if [ ! -s "$KEY_FILE" ]; then
  say "Note: raw ingest key not cached — visit /sdk-setup in the UI to issue a new one."
fi

# ── 4. ingest sample errors (only if we have the raw key) ──────────
if [ -s "$KEY_FILE" ]; then
  API_KEY="$(cat "$KEY_FILE")"
  say "Ingesting sample errors ..."

  send_error() {
    local payload="$1"
    curl -fs -o /dev/null -X POST "$BACKEND/ingest/v1/errors" \
      -H "Content-Type: application/json" \
      -H "X-SeeStack-Key: $API_KEY" \
      -d "$payload"
  }

  # RuntimeException (3 occurrences -> one group)
  for i in 1 2 3; do
    send_error "{
      \"exceptionClass\": \"RuntimeException\",
      \"message\": \"Checkout failed: order #$((1000 + i)) missing inventory\",
      \"stackTrace\": [
        \"at com.demo.CheckoutService.finalize(CheckoutService.java:82)\",
        \"at com.demo.OrderController.placeOrder(OrderController.java:41)\",
        \"at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1000)\"
      ],
      \"level\": \"error\",
      \"environment\": \"production\",
      \"release\": \"1.0.0\",
      \"user\": { \"id\": \"user-$((100 + i))\", \"email\": \"alice$((100 + i))@example.com\" },
      \"metadata\": { \"orderId\": $((1000 + i)) }
    }"
  done

  # NullPointerException (1 occurrence)
  send_error '{
    "exceptionClass": "NullPointerException",
    "message": "Cannot invoke String.length() because profile.displayName is null",
    "stackTrace": [
      "at com.demo.ProfileRenderer.render(ProfileRenderer.java:27)",
      "at com.demo.ProfileController.view(ProfileController.java:19)"
    ],
    "level": "error",
    "environment": "production"
  }'

  # IllegalStateException warning in staging
  send_error '{
    "exceptionClass": "IllegalStateException",
    "message": "feature flag `new-billing` referenced before initialisation",
    "stackTrace": [
      "at com.demo.FeatureFlags.require(FeatureFlags.java:54)",
      "at com.demo.Migrator.run(Migrator.java:18)"
    ],
    "level": "warning",
    "environment": "staging"
  }'

  say "Ingested 3 + 1 + 1 events (expected: 3 grouped issues)."
fi

# ── 5. ensure two monitors exist ───────────────────────────────────
monitors_body="$(curl -fs -H "Authorization: Bearer $TOKEN" \
  "$BACKEND/api/v1/monitors?projectId=$PROJECT_ID")"
existing_monitors="$(printf '%s' "$monitors_body" \
  | python3 -c 'import json,sys;d=json.loads(sys.stdin.read())["data"]["items"];print(len(d))')"

if [ "$existing_monitors" = "0" ]; then
  say "Creating demo monitors ..."
  for spec in \
    '{"name":"Example UP","url":"https://example.com","intervalMinutes":1}' \
    '{"name":"Unreachable DOWN","url":"http://127.0.0.1:1/nope","intervalMinutes":1}'
  do
    body="{\"projectId\":\"$PROJECT_ID\", $(echo "$spec" | sed 's/^{//')"
    curl -fs -o /dev/null -X POST "$BACKEND/api/v1/monitors" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$body"
  done
  say "Two monitors created — the scheduler will check them within 60 s."
else
  say "Monitors already exist — skipping."
fi

# ── 6. write state file for other scripts ──────────────────────────
cat > "$STATE" <<EOF
DEMO_EMAIL=$EMAIL
DEMO_PASSWORD=$PASSWORD
DEMO_PROJECT_ID=$PROJECT_ID
DEMO_PROJECT_NAME=$PROJECT_NAME
EOF

say "Seed complete."

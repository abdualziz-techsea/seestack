#!/usr/bin/env bash
# Seeds the demo account + project + sample errors + monitors.
# Idempotent — safe to re-run.
#
# Writes two files consumed by other scripts and by the demo banner:
#   scripts/.demo-state           (KEY=VALUE env file)
#   scripts/.demo-api-key         (raw ingest key, one-line)

set -euo pipefail

BACKEND="${SEESTACK_BACKEND:-http://localhost:8082}"
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

  # High-frequency error to drive insights / spike detection (15 events,
  # all sharing the same top stack frame and the same /api/checkout endpoint)
  for i in $(seq 1 15); do
    send_error "{
      \"exceptionClass\": \"DatabaseTimeoutException\",
      \"message\": \"Postgres statement timed out after 30s on order #$((2000 + i))\",
      \"stackTrace\": [
        \"at com.demo.OrderRepository.save(OrderRepository.java:118)\",
        \"at com.demo.CheckoutService.placeOrder(CheckoutService.java:64)\",
        \"at com.demo.api.CheckoutController.checkout(CheckoutController.java:42)\",
        \"at jdk.internal.reflect.GeneratedMethodAccessor.invoke(Unknown Source)\",
        \"at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1000)\"
      ],
      \"level\": \"error\",
      \"environment\": \"production\",
      \"release\": \"1.4.2\",
      \"user\": { \"id\": \"user-$((200 + i))\", \"email\": \"buyer$((200 + i))@example.com\" },
      \"metadata\": {
        \"path\": \"/api/checkout\",
        \"method\": \"POST\",
        \"orderId\": $((2000 + i)),
        \"runtime\": \"Java 17\",
        \"sdk\": \"seestack-java/1.0.0\"
      }
    }" || true
  done

  say "Ingested 3 + 1 + 1 + 15 events (expected: 4 grouped issues; one high-frequency)."
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

# ── 7. seed one security scan (Basic Port Exposure Check) ─────────
scans_body="$(curl -fs -H "Authorization: Bearer $TOKEN" \
  "$BACKEND/api/v1/security-scans?page=1&perPage=1" || echo '{"data":{"items":[]}}')"
existing_scans="$(printf '%s' "$scans_body" \
  | python3 -c 'import json,sys
try:
  d=json.loads(sys.stdin.read())
  print(len(d.get("data",{}).get("items",[])))
except Exception:
  print(0)' 2>/dev/null || echo 0)"

if [ "$existing_scans" = "0" ]; then
  say "Running a demo Basic Port Exposure Check against example.com ..."
  curl -fs -o /dev/null -X POST "$BACKEND/api/v1/security-scans" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"target\":\"example.com\",\"projectId\":\"$PROJECT_ID\"}" || true
  say "Demo security scan seeded."
else
  say "Security scan already exists — skipping."
fi

# ── 8. seed one Basic Load Test against the healthy monitor ──────
loadtests_body="$(curl -fs -H "Authorization: Bearer $TOKEN" \
  "$BACKEND/api/v1/load-tests?projectId=$PROJECT_ID&page=1&perPage=1" || echo '{"data":{"items":[]}}')"
existing_loadtests="$(printf '%s' "$loadtests_body" \
  | python3 -c 'import json,sys
try:
  d=json.loads(sys.stdin.read())
  print(len(d.get("data",{}).get("items",[])))
except Exception:
  print(0)' 2>/dev/null || echo 0)"

if [ "$existing_loadtests" = "0" ]; then
  # Pick the first monitor that looks like the healthy "Example UP".
  monitors_refresh="$(curl -fs -H "Authorization: Bearer $TOKEN" \
    "$BACKEND/api/v1/monitors?projectId=$PROJECT_ID" || echo '')"
  MONITOR_ID="$(printf '%s' "$monitors_refresh" \
    | python3 -c 'import json,sys
try:
  d=json.loads(sys.stdin.read())["data"]["items"]
  m=next((x for x in d if "example.com" in x.get("url","")), d[0] if d else None)
  print(m["id"] if m else "")
except Exception:
  print("")' 2>/dev/null || echo '')"

  if [ -n "$MONITOR_ID" ]; then
    say "Running a demo Basic Load Test (10 requests, concurrency 2) against the seeded monitor ..."
    curl -fs -o /dev/null -X POST "$BACKEND/api/v1/load-tests" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"projectId\":\"$PROJECT_ID\",\"monitorId\":\"$MONITOR_ID\",\"requests\":10,\"concurrency\":2}" || true
    say "Demo load test seeded."
  else
    say "No monitor available to load-test — skipping."
  fi
else
  say "Load test already exists — skipping."
fi

say "Seed complete."

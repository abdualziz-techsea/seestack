#!/usr/bin/env bash
# seeStack — one-command demo launcher.
#
#   ./run-demo.sh         # start everything + seed + print access info
#   ./run-demo.sh stop    # stop backend, frontend, and infra containers
#
# On first run this will:
#   1. start postgres / clickhouse / kafka / redis via docker compose
#   2. build the backend jar if missing
#   3. launch the Spring Boot backend on :8082
#   4. install + launch the Vite frontend on :3002
#   5. seed a demo account + project + sample errors + 2 monitors
#   6. print the URLs + demo credentials

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO"

BLUE="$(printf '\033[34m')"; GREEN="$(printf '\033[32m')"; DIM="$(printf '\033[2m')"; BOLD="$(printf '\033[1m')"; RESET="$(printf '\033[0m')"
log()  { printf "${BLUE}▸${RESET} %s\n" "$*"; }
ok()   { printf "${GREEN}✓${RESET} %s\n" "$*"; }
dim()  { printf "${DIM}%s${RESET}\n" "$*"; }

PID_DIR="$REPO/scripts/.run"
mkdir -p "$PID_DIR"
BACKEND_PID="$PID_DIR/backend.pid"
FRONTEND_PID="$PID_DIR/frontend.pid"
BACKEND_LOG="$PID_DIR/backend.log"
FRONTEND_LOG="$PID_DIR/frontend.log"

# ── stop subcommand ───────────────────────────────────────────────
if [ "${1:-}" = "stop" ]; then
  log "Stopping seeStack ..."
  [ -f "$BACKEND_PID" ]  && kill "$(cat "$BACKEND_PID")" 2>/dev/null || true
  [ -f "$FRONTEND_PID" ] && kill "$(cat "$FRONTEND_PID")" 2>/dev/null || true
  pkill -f seestack-backend-0.0.1-SNAPSHOT.jar 2>/dev/null || true
  pkill -f "vite.*@seestack/web" 2>/dev/null || true
  if [ "${2:-}" = "--clean" ]; then
    (cd "$REPO/infra/docker" && docker compose down -v) || true
    rm -f "$REPO/scripts/.demo-state" "$REPO/scripts/.demo-api-key"
  else
    (cd "$REPO/infra/docker" && docker compose down) || true
  fi
  rm -f "$BACKEND_PID" "$FRONTEND_PID"
  ok "Stopped."
  exit 0
fi

# ── 0. preflight ──────────────────────────────────────────────────
need() {
  command -v "$1" >/dev/null 2>&1 || { echo "Missing required tool: $1" >&2; exit 1; }
}
need docker
need java
need node
need pnpm
need python3
need curl

# ── 1. infra ──────────────────────────────────────────────────────
log "Starting infrastructure (postgres / clickhouse / kafka / redis) ..."
(cd "$REPO/infra/docker" \
  && { [ -f .env ] || cp .env.example .env 2>/dev/null || true; } \
  && docker compose up -d postgres redis clickhouse kafka >/dev/null)

log "Waiting for postgres + clickhouse ..."
until docker exec seestack-postgres psql -U seestack -d seestack -c "SELECT 1" >/dev/null 2>&1; do sleep 1; done
until curl -fs http://localhost:18123/ping >/dev/null 2>&1; do sleep 1; done
ok "Infrastructure healthy."

# ── 2. backend jar ────────────────────────────────────────────────
JAR="$REPO/backend/build/libs/seestack-backend-0.0.1-SNAPSHOT.jar"
if [ ! -f "$JAR" ]; then
  log "Building backend jar (first run) ..."
  export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home -v 25 2>/dev/null || echo "")}"
  (cd "$REPO/backend" && gradle bootJar -x test --no-daemon >/dev/null)
fi
ok "Backend jar present."

# ── 3. start backend ──────────────────────────────────────────────
if curl -fs http://localhost:8082/actuator/health 2>/dev/null | grep -q UP; then
  ok "Backend already running on :8082."
else
  log "Starting backend on :8082 ..."
  export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 17 2>/dev/null || /usr/libexec/java_home -v 25 2>/dev/null || echo "")}"
  export PATH="$JAVA_HOME/bin:$PATH"
  export POSTGRES_HOST=localhost POSTGRES_PORT=5433
  export POSTGRES_DB=seestack POSTGRES_USER=seestack
  export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-change-me-strong-password}"
  export REDIS_HOST=localhost REDIS_PORT=16379 REDIS_PASSWORD="${REDIS_PASSWORD:-devredis}"
  export KAFKA_BOOTSTRAP_SERVERS=localhost:19092
  export CLICKHOUSE_HOST=localhost CLICKHOUSE_PORT=18123
  export CLICKHOUSE_DB=seestack CLICKHOUSE_USER=default
  export SEESTACK_JWT_SECRET="${SEESTACK_JWT_SECRET:-dev-insecure-change-me-in-production-32chars-abc}"
  nohup java -jar "$JAR" > "$BACKEND_LOG" 2>&1 &
  echo $! > "$BACKEND_PID"

  until curl -fs http://localhost:8082/actuator/health 2>/dev/null | grep -q UP; do
    if ! kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null; then
      echo "Backend failed to start. Last 40 log lines:" >&2
      tail -n 40 "$BACKEND_LOG" >&2
      exit 1
    fi
    sleep 1
  done
  ok "Backend UP."
fi

# ── 4. frontend ───────────────────────────────────────────────────
if curl -fs http://localhost:3002/ >/dev/null 2>&1; then
  ok "Frontend already running on :3002."
else
  log "Installing frontend deps (if needed) ..."
  (cd "$REPO" && pnpm install --silent >/dev/null)
  log "Starting frontend on :3002 ..."
  (cd "$REPO" && nohup pnpm --filter @seestack/web dev > "$FRONTEND_LOG" 2>&1 &
   echo $! > "$FRONTEND_PID")
  until curl -fs http://localhost:3002/ >/dev/null 2>&1; do sleep 1; done
  ok "Frontend UP."
fi

# ── 5. seed demo data ─────────────────────────────────────────────
log "Seeding demo account + project + errors + monitors ..."
bash "$REPO/scripts/seed-demo.sh"
ok "Demo data seeded."

# ── 5b. run the SDK demo so events are also visible from the SDK ──
if command -v node >/dev/null 2>&1 && [ -s "$REPO/scripts/.demo-api-key" ]; then
  log "Running JavaScript SDK demo against the seeded project ..."
  SEESTACK_API_KEY="$(cat "$REPO/scripts/.demo-api-key")" \
  SEESTACK_ENDPOINT="http://localhost:8082" \
    node "$REPO/sdks/examples/example-app.js" | sed 's/^/    /' || true
  ok "SDK demo sent."
fi

# ── 6. banner ─────────────────────────────────────────────────────
EMAIL="$(grep '^DEMO_EMAIL=' "$REPO/scripts/.demo-state" | cut -d= -f2-)"
PASSWORD="$(grep '^DEMO_PASSWORD=' "$REPO/scripts/.demo-state" | cut -d= -f2-)"

printf "\n"
printf "${BOLD}seeStack is running.${RESET}\n"
printf "\n"
printf "  ${BOLD}Frontend${RESET}        http://localhost:3002\n"
printf "  ${BOLD}Backend${RESET}         http://localhost:8082\n"
printf "  ${BOLD}Health${RESET}          http://localhost:8082/actuator/health\n"
printf "\n"
printf "  ${BOLD}Demo login${RESET}\n"
printf "    Email       %s\n" "$EMAIL"
printf "    Password    %s\n" "$PASSWORD"
printf "\n"
printf "  ${BOLD}Test commands${RESET}\n"
printf "    Generate a fresh error           ${DIM}./test-error.sh${RESET}\n"
printf "    Run the JavaScript SDK demo      ${DIM}./run-sdk-demo.sh${RESET}\n"
printf "    Stop everything                  ${DIM}./run-demo.sh stop${RESET}\n"
printf "    Stop + wipe seeded data          ${DIM}./run-demo.sh stop --clean${RESET}\n"
printf "\n"
dim "Logs: $BACKEND_LOG  ·  $FRONTEND_LOG"

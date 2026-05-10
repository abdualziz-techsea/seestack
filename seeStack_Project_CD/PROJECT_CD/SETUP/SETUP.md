# seeStack — Local Setup

Exact steps to bring the full stack up and use it. Assumes the
prerequisites in `../PREREQUISITES/README.md` are installed.

Paths below are relative to the repository root
(`/Volumes/M.2/MyProjects/seestack` on the development machine, or
wherever you cloned the project).

## 1. Start the infrastructure

```bash
cd infra/docker
cp .env.example .env   # if a local .env is not already present
docker compose up -d postgres redis clickhouse kafka
```

Wait until all four containers are healthy (~30 s):

```bash
docker compose ps
```

You should see `seestack-postgres`, `seestack-clickhouse`,
`seestack-kafka`, and `seestack-redis` all listed as `healthy` or
`Up`.

## 2. Build the backend

```bash
cd ../../backend            # -> <repo>/backend
export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null \
                   || /usr/libexec/java_home -v 25)
gradle bootJar -x test
```

The fat jar lands at
`backend/build/libs/seestack-backend-0.0.1-SNAPSHOT.jar`.

## 3. Run the backend

```bash
export POSTGRES_HOST=localhost POSTGRES_PORT=5433
export POSTGRES_DB=seestack POSTGRES_USER=seestack
export POSTGRES_PASSWORD=change-me-strong-password
export REDIS_HOST=localhost REDIS_PORT=16379 REDIS_PASSWORD=devredis
export KAFKA_BOOTSTRAP_SERVERS=localhost:19092
export CLICKHOUSE_HOST=localhost CLICKHOUSE_PORT=18123
export CLICKHOUSE_DB=seestack CLICKHOUSE_USER=default
export SEESTACK_JWT_SECRET=dev-insecure-change-me-in-production-32chars
# Optional: enables AI-assisted error analysis
# export OPENAI_API_KEY=sk-...

java -jar build/libs/seestack-backend-0.0.1-SNAPSHOT.jar
```

Verify it started:

```bash
curl http://localhost:8082/actuator/health
# -> {"status":"UP"}
```

Flyway creates eight application tables (`users`, `projects`,
`api_keys`, `monitor_configs`, `error_groups`, `security_scans`,
`load_tests`, `ai_error_analyses`) plus `flyway_schema_history` on
first boot. The ClickHouse schema initialiser creates
`seestack.errors`, `seestack.monitor_checks`, and the supporting
telemetry tables documented in `../DATABASE/DATABASE_README.md`.

### Optional — enable AI error analysis

Export `OPENAI_API_KEY` before starting the backend to enable the
**Explain & Suggest Fix** button on the error detail page:

```bash
export OPENAI_API_KEY=sk-...
```

If the key is not set, the feature degrades gracefully and the
dashboard shows "AI analysis is not configured."

## 4. Run the frontend

```bash
cd ../packages/web   # -> <repo>/packages/web
pnpm install         # only needed on first run
pnpm dev
```

The Vite dev server serves the SPA on **http://localhost:3002** and
proxies `/api/*` and `/ingest/*` to the backend on port 8082.

## 5. Use the dashboard

1. Open <http://localhost:3002/register>.
2. Enter a name, email, and password (≥ 8 chars). Submit. You are
   redirected to `/overview` with a JWT stored in `localStorage`.
3. The register flow creates a default project for you. Visit
   `/projects` to see it, or click **+ New project** to create
   another — the raw ingest key is revealed **once** right after
   creation.
4. Visit `/sdk-setup` for copy-able snippets in JavaScript, Java,
   and Python. The selected project's ingest key is inlined into
   each snippet.

## 6. Send a real error from the SDK

```bash
SEESTACK_API_KEY=ask_live_<your_raw_key> \
SEESTACK_ENDPOINT=http://localhost:8082 \
  node sdks/examples/example-app.js
```

The example raises three runtime errors; all three appear on the
dashboard's **Errors** page within seconds.

## 7a. Basic Security Analysis

From the dashboard, open **Security Scan** and enter a hostname
(e.g. `example.com`), then click **Run scan**. The backend runs a
single TCP connect against each port in a small fixed list (22,
80, 443, 3306, 5432, 6379, 8080, 8443) with a 1.5 s timeout and
stores the result. It also records service hints, HTTP information,
security header checks, risk score, risk level, and a short summary.

This is intentionally a narrow, educational probe — not a
penetration test. No external tools are used; it relies only on
`java.net.Socket`.

## 7b. Basic Load Test

Create or use an existing monitor first. Then open **Load Test**,
select the monitor, choose a request count and concurrency within the
displayed limits, and click **Run test**. The backend runs a capped
HTTP GET test with these enforced limits:

- Maximum 100 requests.
- Maximum 10 concurrency.
- Five second timeout per request.
- 60 second cooldown per target.

Results are stored in PostgreSQL `load_tests` and include request
totals, latency statistics, and status-code distribution.

## 8. Monitor a website

On `/monitors`, click **+ Add monitor** (or POST to
`/api/v1/monitors` with a Bearer JWT). The scheduler wakes every
60 s, performs a real HTTP GET against the URL, and records the
result in ClickHouse. The monitor card shows current status
(`OPERATIONAL` / `DOWN`), last response time, and uptime %.

## 9. Shut down

```bash
pkill -f seestack-backend-0.0.1-SNAPSHOT.jar
pkill -f "pnpm dev"                # or stop via your terminal
cd <repo>/infra/docker
docker compose down                # add -v to wipe the volumes
```

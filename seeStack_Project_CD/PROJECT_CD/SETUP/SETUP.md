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

java -jar build/libs/seestack-backend-0.0.1-SNAPSHOT.jar
```

Verify it started:

```bash
curl http://localhost:8080/actuator/health
# -> {"status":"UP"}
```

Flyway creates all six tables (`users`, `projects`, `api_keys`,
`monitor_configs`, `error_groups`, `flyway_schema_history`) on first
boot, and the ClickHouse schema initialiser creates
`seestack.errors` and `seestack.monitor_checks`.

## 4. Run the frontend

```bash
cd ../packages/web   # -> <repo>/packages/web
pnpm install         # only needed on first run
pnpm dev
```

The Vite dev server serves the SPA on **http://localhost:3000** and
proxies `/api/*` and `/ingest/*` to the backend on port 8080.

## 5. Use the dashboard

1. Open <http://localhost:3000/register>.
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
SEESTACK_ENDPOINT=http://localhost:8080 \
  node sdks/examples/example-app.js
```

The example raises three runtime errors; all three appear on the
dashboard's **Errors** page within seconds.

## 7. Monitor a website

On `/monitors`, click **+ Add monitor** (or POST to
`/api/v1/monitors` with a Bearer JWT). The scheduler wakes every
60 s, performs a real HTTP GET against the URL, and records the
result in ClickHouse. The monitor card shows current status
(`OPERATIONAL` / `DOWN`), last response time, and uptime %.

## 8. Shut down

```bash
pkill -f seestack-backend-0.0.1-SNAPSHOT.jar
pkill -f "pnpm dev"                # or stop via your terminal
cd <repo>/infra/docker
docker compose down                # add -v to wipe the volumes
```

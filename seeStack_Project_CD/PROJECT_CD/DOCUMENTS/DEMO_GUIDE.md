# seeStack — Demo Guide

This page walks a reviewer through running and demonstrating seeStack
with **one command** and **zero manual configuration**.

## 1. Start everything

From the repository root:

```bash
./run-demo.sh
```

The script:

1. Starts the infrastructure containers — PostgreSQL, ClickHouse,
   Apache Kafka (KRaft mode), Redis.
2. Builds the backend jar (only on the first run) and launches the
   Spring Boot backend on `:8082`.
3. Installs the frontend dependencies (only on the first run) and
   launches the Vite dev server on `:3000`.
4. Waits until the backend `/actuator/health` returns `UP` and the
   frontend answers on `:3000`.
5. Seeds the demo account, the demo project with its ingest key, a
   set of realistic grouped errors, and two monitors (one healthy,
   one unreachable).
6. Runs the JavaScript SDK demo so the dashboard already contains
   SDK-originated events as well.
7. Prints the access URLs and demo credentials.

Expected output ends with something like:

```
seeStack is running.

  Frontend        http://localhost:3002
  Backend         http://localhost:8082
  Health          http://localhost:8082/actuator/health

  Demo login
    Email       demo@seestack.local
    Password    Demo@12345

  Test commands
    Generate a fresh error           ./test-error.sh
    Run the JavaScript SDK demo      ./run-sdk-demo.sh
    Stop everything                  ./run-demo.sh stop
    Stop + wipe seeded data          ./run-demo.sh stop --clean
```

## 2. Demo credentials

| Field     | Value                  |
| --------- | ---------------------- |
| URL       | http://localhost:3002  |
| Email     | `demo@seestack.local`  |
| Password  | `Demo@12345`           |

Log in at <http://localhost:3002/login>. No registration step is
required.

## 3. What you will see after login

The dashboard opens on **Overview** with the seeded demo project
already selected. The sidebar has seven entries, in order:

1. **Overview** — total errors, unresolved errors, monitors up /
   down, recent errors, monitor status panel, and the latest
   security scan result.
2. **Projects** — the demo project, with its safe ingest-key
   prefix. You can create more projects here; every new project
   reveals its one-time ingest key directly in the list.
3. **Errors** — grouped issues from the seeded data and from the
   SDK demo.
4. **Monitors** — the two seeded monitors: `example.com`
   (Operational) and `http://127.0.0.1:1/nope` (Down).
5. **Security Scan** — a simple "Basic Port Exposure Check"
   feature that probes a small, fixed list of common TCP ports
   (22, 80, 443, 3306, 5432, 6379, 8080, 8443) on a given
   hostname using only Java networking APIs. One example scan
   against `example.com` is seeded on first run.
6. **Load Test** — a controlled "Basic Load Test" feature that
   runs a small, capped volume of HTTP GETs (≤ 100 requests,
   ≤ 10 concurrent, 5 s per-request timeout) against a URL the
   user has already saved as a monitor. A 60 s per-target
   cooldown prevents repeated runs. Implemented purely with
   `java.net.http.HttpClient` — no external stress tools.
   Reports total / successful / failed requests, min/avg/max/p95
   response time, and a status-code distribution. One example
   load test (10 requests, concurrency 2) against the seeded
   `example.com` monitor is run on first startup.
7. **SDK Setup** — copy-ready install, initialisation, and capture
   snippets in JavaScript, Java, and Python, each pre-filled with
   the selected project’s ingest key.

Clicking any row on **Errors** opens a dedicated detail page at
`/errors/:fingerprint` with the exception class, full message, stack
trace, occurrence count, first/last seen timestamps, environment,
release, request metadata, recent occurrences, and project badge.

### Error Insights

The detail page also renders a compact Insights card:

- Impact level (LOW / MEDIUM / HIGH)
- Total occurrences
- Recent activity ("Active recently" / "No recent activity")
- First seen and Last seen
- Detected patterns (e.g. same top stack frame, same endpoint)
- Why this error is grouped (fingerprint inputs and formula)
- Hourly timeline for the last 24 hours

### AI-assisted error explanation

Each error detail page now includes an **Explain & Suggest Fix**
button. When clicked, the backend sanitises the error payload
(stripping tokens, passwords, and authorization headers) and calls
the OpenAI Chat Completions API. The response is rendered as four
cards: *What happened*, *Likely cause*, *Suggested fix*, and
*Prevention tips*.

To enable this feature, export `OPENAI_API_KEY` in the environment
used to start the backend:

```bash
export OPENAI_API_KEY=sk-...
./run-demo.sh
```

If the key is missing, the dashboard renders the message
“AI analysis is not configured. Set OPENAI_API_KEY to enable this
feature.” and no outbound request is made.

## 4. Generate a fresh test error

```bash
./test-error.sh
# or with a custom exception class and message:
./test-error.sh DatabaseTimeout "Postgres statement timed out after 30s"
```

Output:

```
OK — sent DatabaseTimeout (event id f3a0…)
Visit http://localhost:3002/errors to see it.
```

Refresh the **Errors** page and the new event appears at the top.

## 5. Run the JavaScript SDK demo

```bash
./run-sdk-demo.sh
```

This runs `sdks/examples/example-app.js` against the seeded demo
project using its real ingest key. The script ships two identical
`TypeError`s (to demonstrate grouping) plus one distinct
`SyntaxError`. Every event is acknowledged with HTTP `202` and
appears in the dashboard within seconds.

## 6. Verify monitor behaviour

- The monitor scheduler runs every minute.
- `example.com` is classified **up** (status `2xx`, response under
  30 s); the unreachable URL is classified **down** (status `0`).
- Results land in ClickHouse `seestack.monitor_checks` and feed the
  dashboard's `/monitors` cards with current status, last response
  time, and uptime percentage.

Wait up to one minute after startup for the first checks to be
recorded.

## 7. Test the SDKs manually

If you would like to send events from code rather than from the
demo script, snippets are available on the dashboard **SDK Setup**
page for JavaScript, Java, and Python. Each snippet is pre-filled
with the selected project’s ingest key. The only transport detail
is:

```
POST http://localhost:8082/ingest/v1/errors
Header: X-SeeStack-Key: <the project ingest key>
Body:   JSON event payload
```

## 8. Stop the demo

```bash
./run-demo.sh stop               # stop backend + frontend + infra, keep data
./run-demo.sh stop --clean       # same, plus wipe database volumes and seed state
```

## 9. Troubleshooting

- The script exits early if Docker, Java, Node, pnpm, or Python 3 is
  missing; the exact missing tool is reported.
- Backend logs:   `scripts/.run/backend.log`
- Frontend logs:  `scripts/.run/frontend.log`
- To re-run the seed step on an existing instance:
  `bash scripts/seed-demo.sh`

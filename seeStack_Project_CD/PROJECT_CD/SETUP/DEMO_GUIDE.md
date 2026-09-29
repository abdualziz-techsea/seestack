# seeStack — Demo Guide

This guide is the fastest, simplest way to see seeStack working. It
is written for a reviewer who only wants to (a) start the system,
(b) log in, and (c) walk through the delivered features. No
development experience is assumed.

The detailed manual setup lives in `SETUP.md`. Most reviewers should
not need it.

---

## 1. One command to start everything

From the repository root (the folder that contains `run-demo.sh`):

```bash
./run-demo.sh
```

That single command will:

1. Start PostgreSQL, ClickHouse, Kafka, and Redis as Docker
   containers.
2. Build the Spring Boot backend if a fresh jar is missing.
3. Launch the backend on port **8082**.
4. Install frontend dependencies (first run only) and start the
   dashboard on port **3002**.
5. Seed a demo account, a default project, two website monitors,
   and a few sample errors.
6. Print a short summary with the URLs and the demo credentials.

Wait until the script prints "Ready". The first run takes a few
minutes (Docker images and the backend build). Subsequent runs start
in under a minute.

---

## 2. URLs

| What                          | Address                                  |
| ----------------------------- | ---------------------------------------- |
| Dashboard (open in a browser) | <http://localhost:3002>                  |
| Backend health check          | <http://localhost:8082/actuator/health>  |

The separate Next.js documentation site under `docs/` is optional
reference material for the SDKs. It is not started by
`run-demo.sh` and is not required for the demo.

---

## 3. Demo credentials

Use these on the **Login** page at <http://localhost:3002/login>:

```
Email:    demo@seestack.local
Password: Demo@12345
```

The demo account is created automatically by the launcher. If you
prefer to create your own account, click "Register" instead and
choose any email and a password of at least 8 characters.

---

## 4. Demo walkthrough

A complete demo takes about 8–10 minutes. Each step builds on the
previous one.

### Step 1 — Login

Open <http://localhost:3002> and sign in with the demo credentials
above. You will land on the **Overview** page.

### Step 2 — Open Overview

The Overview page summarises errors, monitors, and recent activity
across the demo project. The seed has already populated it; you
should see a non-empty stats panel.

### Step 3 — Open Projects

Click **Projects** in the sidebar. The seeded "My First Project" is
listed. Click it to see project-scoped settings, including the
ingest API key preview.

### Step 4 — Open SDK Setup

Click **SDK Setup** in the sidebar. This page shows copy-paste
snippets for the JavaScript, Java, and Python SDKs with the demo
project's ingest key already inlined. You do not need to paste
anything; the next step uses the same key automatically.

### Step 5 — Trigger a real error from the terminal

In a second terminal window, from the repository root:

```bash
./test-error.sh
```

This script raises three real runtime errors against the demo
project's ingest endpoint. Within a few seconds they will appear on
the dashboard.

### Step 6 — Refresh the Errors page

Click **Errors** in the sidebar (or refresh if you are already on
it). You will see three new grouped errors with occurrence counts,
levels, and timestamps.

### Step 7 — Try AI Analysis

Click any of the three errors to open its detail page. Click
**Explain & Suggest Fix**.

- If the launcher saw an `OPENAI_API_KEY` in your environment, the
  page will display a natural-language explanation and a suggested
  fix from OpenAI gpt-4o-mini.
- If no key is set, the page will display a clear "AI analysis is
  not configured" message. This is the expected behaviour for a
  fully offline demo.

### Step 8 — Open Security Scan

Click **Security Scan** in the sidebar. Type `example.com` (or any
public hostname) and click **Run scan**. After a few seconds the
result appears: open and closed ports, HTTP information, security
header check, risk score, risk level, and a short summary. This
feature is intentionally educational and only inspects publicly
observable surface — it does not exploit anything.

### Step 9 — Run a Load Test

Click **Load Test** in the sidebar. Pick one of the seeded monitors
as the target, choose a request count (≤ 100) and concurrency
(≤ 10), and click **Run test**. After a few seconds the result page
shows total requests, success rate, latency statistics, and the
status-code distribution.

---

## 5. How to stop the system

When you are finished, run the same launcher with `stop`:

```bash
./run-demo.sh stop
```

This stops the backend, the frontend, and the four Docker
containers. Add `--clean` to also delete the database volumes (you
will lose the seeded demo data on the next start):

```bash
./run-demo.sh stop --clean
```

---

## 6. Troubleshooting

| Symptom                                    | Likely cause                                                    | Fix                                              |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------ |
| `localhost:3002` will not load             | Frontend still installing on first run                          | Wait until the launcher prints "Ready"           |
| `localhost:8082/actuator/health` returns 503 | Postgres/ClickHouse/Kafka still booting                       | Wait 20 s and retry                              |
| Login fails with the demo credentials      | A previous run was stopped with `--clean` and then not reseeded | Run `./run-demo.sh` again                        |
| AI Analysis shows "not configured"         | `OPENAI_API_KEY` was not set when the backend started           | Export the key and restart with `./run-demo.sh`  |
| Port 3002 or 8082 is already in use        | Another process is bound to that port                           | Stop that process or change the launcher's ports |

---

That is the entire demo. The point of seeStack is to bring four
small developer tools (errors, uptime, load, security) into a
single dashboard with optional AI assistance — please feel free to
explore the rest of the UI beyond the scripted walkthrough.

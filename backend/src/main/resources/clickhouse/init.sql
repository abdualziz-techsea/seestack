-- ClickHouse schema initialization for SeeStack
-- Run once on startup via ClickHouseSchemaInitializer bean
-- All tables use MergeTree engine with ORDER BY (project_id, timestamp)

CREATE DATABASE IF NOT EXISTS seestack;

-- ── Errors ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seestack.errors
(
    id              UUID            DEFAULT generateUUIDv4(),
    project_id      UUID            NOT NULL,
    fingerprint     String          NOT NULL,
    exceptionClass  String          NOT NULL,
    message         String          NOT NULL,
    stack_trace String,
    level       LowCardinality(String),
    environment LowCardinality(String),
    release     String,
    user_id     String,
    user_email  String,
    user_ip     String,
    metadata    String,
    timestamp   DateTime64(3)   NOT NULL
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

-- ── Logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seestack.logs
(
    id         UUID          DEFAULT generateUUIDv4(),
    project_id UUID          NOT NULL,
    level      LowCardinality(String),
    message    String        NOT NULL,
    service    LowCardinality(String),
    trace_id   String,
    metadata   String,
    timestamp  DateTime64(3) NOT NULL
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 14 DAY
SETTINGS index_granularity = 8192;

-- ── Monitor Checks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seestack.monitor_checks
(
    monitor_id       UUID          NOT NULL,
    project_id       UUID          NOT NULL,
    status           UInt8         NOT NULL,
    response_time_ms UInt32        NOT NULL,
    status_code      UInt16        NOT NULL,
    timestamp        DateTime64(3) NOT NULL
) ENGINE = MergeTree()
ORDER BY (monitor_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- ── SSH Audit Logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seestack.ssh_audit_logs
(
    id         UUID          DEFAULT generateUUIDv4(),
    server_id  UUID          NOT NULL,
    project_id UUID          NOT NULL,
    user_id    UUID          NOT NULL,
    command    String,
    output     String,
    timestamp  DateTime64(3) NOT NULL
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- ── Cron Pings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seestack.cron_pings
(
    id           UUID DEFAULT generateUUIDv4(),
    monitor_id   UUID,
    project_id   UUID,
    status       LowCardinality(String),
    duration_ms  UInt32,
    message      String,
    timestamp    DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (monitor_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- ── HTTP Requests ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seestack.http_requests
(
    id                UUID DEFAULT generateUUIDv4(),
    project_id        UUID,
    trace_id          String,
    direction         LowCardinality(String),
    method            LowCardinality(String),
    host              String,
    path              String,
    status_code       UInt16,
    duration_ms       UInt32,
    request_size      UInt32,
    response_size     UInt32,
    user_id           String,
    error_fingerprint String,
    is_slow           UInt8,
    timestamp         DateTime64(3)
) ENGINE = MergeTree()
ORDER BY (project_id, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

-- ── Session Replay Events ───────────────────────────────────
CREATE TABLE IF NOT EXISTS seestack.replay_events
(
    id           UUID          DEFAULT generateUUIDv4(),
    project_id   UUID          NOT NULL,
    fingerprint  String        NOT NULL,
    session_id   String        NOT NULL,
    event_type   LowCardinality(String) NOT NULL,
    event_data   String        NOT NULL,
    url          String,
    timestamp    DateTime64(3) NOT NULL
) ENGINE = MergeTree()
ORDER BY (project_id, fingerprint, timestamp)
TTL toDateTime(timestamp) + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

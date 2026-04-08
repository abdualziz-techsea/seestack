-- ClickHouse initialization — runs on first container startup

CREATE DATABASE IF NOT EXISTS seestack;

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
TTL toDateTime(timestamp) + INTERVAL 30 DAY;

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
TTL toDateTime(timestamp) + INTERVAL 14 DAY;

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
TTL toDateTime(timestamp) + INTERVAL 90 DAY;

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
TTL toDateTime(timestamp) + INTERVAL 90 DAY;

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
TTL toDateTime(timestamp) + INTERVAL 30 DAY;

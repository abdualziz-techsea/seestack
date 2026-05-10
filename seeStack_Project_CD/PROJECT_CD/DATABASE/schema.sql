-- seeStack consolidated PostgreSQL schema.
-- User -> Projects (1:N). Each project owns API keys, monitors,
-- grouped errors, security scans, load tests, and cached AI analyses.
-- No organizations, no memberships, no plans.

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  platform   VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE INDEX idx_projects_user_id ON projects (user_id);

CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_hash     VARCHAR(255) UNIQUE NOT NULL,
  key_prefix   VARCHAR(20)  NOT NULL DEFAULT '',
  name         VARCHAR(255),
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_project_id ON api_keys (project_id);
CREATE INDEX idx_api_keys_key_hash   ON api_keys (key_hash);

CREATE TABLE monitor_configs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  url              TEXT         NOT NULL,
  interval_minutes INT          NOT NULL DEFAULT 5,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitor_configs_project_id ON monitor_configs (project_id);

CREATE TABLE error_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fingerprint     VARCHAR(64) NOT NULL,
  exception_class VARCHAR(255) NOT NULL,
  title           VARCHAR(500) NOT NULL,
  level           VARCHAR(50),
  environment     VARCHAR(100),
  status          VARCHAR(50)  NOT NULL DEFAULT 'unresolved',
  occurrences     BIGINT       NOT NULL DEFAULT 1,
  first_seen      TIMESTAMPTZ  NOT NULL,
  last_seen       TIMESTAMPTZ  NOT NULL,
  trace_id        VARCHAR(255) NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, fingerprint)
);

CREATE INDEX idx_error_groups_project_id ON error_groups (project_id);

CREATE TABLE security_scans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES projects(id) ON DELETE CASCADE,
  target           VARCHAR(255) NOT NULL,
  resolved_host    VARCHAR(255),
  scanned_ports    TEXT NOT NULL,
  open_ports       TEXT NOT NULL DEFAULT '',
  closed_ports     TEXT NOT NULL DEFAULT '',
  status           VARCHAR(50) NOT NULL DEFAULT 'pending',
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  detected_services TEXT NOT NULL DEFAULT '{}',
  http_info         TEXT NOT NULL DEFAULT '{}',
  security_headers  TEXT NOT NULL DEFAULT '{}',
  risk_score        INT NOT NULL DEFAULT 0,
  risk_level        VARCHAR(20) NOT NULL DEFAULT 'LOW',
  summary           TEXT
);

CREATE INDEX idx_security_scans_project_id ON security_scans (project_id);
CREATE INDEX idx_security_scans_created_at ON security_scans (created_at DESC);

CREATE TABLE load_tests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  monitor_id               UUID REFERENCES monitor_configs(id) ON DELETE SET NULL,
  target_url               TEXT NOT NULL,
  requested_count          INT NOT NULL,
  concurrency              INT NOT NULL,
  status                   VARCHAR(50) NOT NULL DEFAULT 'pending',
  total_requests           INT NOT NULL DEFAULT 0,
  successful_requests      INT NOT NULL DEFAULT 0,
  failed_requests          INT NOT NULL DEFAULT 0,
  avg_response_time_ms     DOUBLE PRECISION NOT NULL DEFAULT 0,
  min_response_time_ms     INT NOT NULL DEFAULT 0,
  max_response_time_ms     INT NOT NULL DEFAULT 0,
  p95_response_time_ms     INT NOT NULL DEFAULT 0,
  status_code_distribution TEXT NOT NULL DEFAULT '{}',
  error_message            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ
);

CREATE INDEX idx_load_tests_project_id ON load_tests (project_id);
CREATE INDEX idx_load_tests_created_at ON load_tests (created_at DESC);

CREATE TABLE ai_error_analyses (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                 UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  fingerprint                VARCHAR(64) NOT NULL,
  payload                    TEXT NOT NULL,
  model                      VARCHAR(100),
  occurrences_at_generation  BIGINT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, fingerprint)
);

CREATE INDEX idx_ai_error_analyses_project_fp
  ON ai_error_analyses (project_id, fingerprint);

-- seeStack consolidated schema.
-- User → Projects (1:N).  Each project owns its API keys, monitors, error groups.
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

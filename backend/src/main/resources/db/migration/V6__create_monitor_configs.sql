CREATE TABLE monitor_configs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  url              TEXT         NOT NULL,
  interval_minutes INT          NOT NULL DEFAULT 5,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitor_configs_project_id ON monitor_configs (project_id);
CREATE INDEX idx_monitor_configs_is_active  ON monitor_configs (is_active);

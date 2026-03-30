CREATE TABLE alert_rules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  config     JSONB       NOT NULL,
  channels   JSONB       NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_project_id ON alert_rules (project_id);
CREATE INDEX idx_alert_rules_is_active  ON alert_rules (is_active);

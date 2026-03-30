CREATE TABLE feature_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  key             VARCHAR(255) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  type            VARCHAR(50) NOT NULL DEFAULT 'boolean',
  default_value   TEXT NOT NULL DEFAULT 'false',
  rollout_percent INT NOT NULL DEFAULT 0
                  CONSTRAINT rollout_percent_range CHECK (rollout_percent BETWEEN 0 AND 100),
  rules           JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, key)
);

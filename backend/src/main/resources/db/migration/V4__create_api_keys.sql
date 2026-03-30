CREATE TABLE api_keys (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  key_hash     VARCHAR(255) UNIQUE NOT NULL,
  name         VARCHAR(255),
  last_used_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_project_id ON api_keys (project_id);
CREATE INDEX idx_api_keys_key_hash   ON api_keys (key_hash);

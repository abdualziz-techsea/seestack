CREATE TABLE flag_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id      UUID REFERENCES feature_flags(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id),
  user_id      UUID REFERENCES users(id),
  action       VARCHAR(50) NOT NULL,
  old_value    JSONB,
  new_value    JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flag_audit_log_flag_id ON flag_audit_log(flag_id);
CREATE INDEX idx_flag_audit_log_project_id ON flag_audit_log(project_id, created_at DESC);

CREATE TABLE project_members (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID    NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id      UUID    NOT NULL REFERENCES users (id)    ON DELETE CASCADE,
  can_errors   BOOLEAN NOT NULL DEFAULT FALSE,
  can_logs     BOOLEAN NOT NULL DEFAULT FALSE,
  can_monitors BOOLEAN NOT NULL DEFAULT FALSE,
  can_ssh      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON project_members (project_id);
CREATE INDEX idx_project_members_user_id    ON project_members (user_id);

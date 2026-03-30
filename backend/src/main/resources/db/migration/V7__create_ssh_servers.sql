CREATE TABLE ssh_servers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  host             VARCHAR(255) NOT NULL,
  port             INT          NOT NULL DEFAULT 22,
  username         VARCHAR(255) NOT NULL,
  private_key_enc  TEXT         NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ssh_servers_project_id ON ssh_servers (project_id);

CREATE TABLE error_groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID          NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  fingerprint      VARCHAR(64)   NOT NULL,
  exception_class  VARCHAR(255)  NOT NULL,
  title            VARCHAR(500)  NOT NULL,
  level            VARCHAR(50),
  environment      VARCHAR(100),
  status           VARCHAR(50)   NOT NULL DEFAULT 'unresolved',
  occurrences      BIGINT        NOT NULL DEFAULT 1,
  first_seen       TIMESTAMPTZ   NOT NULL,
  last_seen        TIMESTAMPTZ   NOT NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, fingerprint)
);

CREATE INDEX idx_error_groups_project_id   ON error_groups (project_id);
CREATE INDEX idx_error_groups_fingerprint  ON error_groups (fingerprint);
CREATE INDEX idx_error_groups_status       ON error_groups (project_id, status);
CREATE INDEX idx_error_groups_last_seen    ON error_groups (project_id, last_seen DESC);

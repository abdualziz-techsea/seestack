CREATE TABLE projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID         NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  platform   VARCHAR(100),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, slug)
);

CREATE INDEX idx_projects_org_id ON projects (org_id);

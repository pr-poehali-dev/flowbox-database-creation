CREATE TABLE IF NOT EXISTS company (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  inn        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

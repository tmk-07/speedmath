CREATE TABLE IF NOT EXISTS progress_codes (
  code TEXT PRIMARY KEY,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Telemetría del enrutador de contacto (wa.comerza.cl).
--
-- Aplicar:
--   npx wrangler d1 migrations apply comerza-wa --local
--   npx wrangler d1 migrations apply comerza-wa --remote
--
-- Ver openspec/proposals/comerza-door-experiment/supervision.md

CREATE TABLE IF NOT EXISTS contact_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at TEXT NOT NULL,
  button TEXT NOT NULL,
  is_human_hours INTEGER NOT NULL DEFAULT 0,
  is_lunch_break INTEGER NOT NULL DEFAULT 0,
  target_line TEXT,
  country TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_events_occurred_at
  ON contact_events (occurred_at);

CREATE INDEX IF NOT EXISTS idx_contact_events_button
  ON contact_events (button);

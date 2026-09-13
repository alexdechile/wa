-- Acceso al panel interno y sesiones.
--
-- Aplicar:
--   npx wrangler d1 migrations apply comerza-wa --local
--   npx wrangler d1 migrations apply comerza-wa --remote
--
-- Ver openspec/proposals/comerza-door-experiment/spec.md

-- Códigos OTP. Nunca se guarda el código en claro: solo su HMAC.
CREATE TABLE IF NOT EXISTS auth_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_email
  ON auth_codes (email, created_at);

-- Sesiones del panel. Se guarda el HMAC del token, no el token.
CREATE TABLE IF NOT EXISTS panel_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_panel_sessions_token
  ON panel_sessions (token_hash);

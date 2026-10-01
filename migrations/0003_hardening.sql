-- Endurecimiento del enrutador y correlación con los leads del puente.
--
-- Aplicar:
--   npx wrangler d1 migrations apply comerza-wa --local
--   npx wrangler d1 migrations apply comerza-wa --remote
--
-- Tres cosas:
--   1. `lead_id`: une cada clic con el lead que generó en el puente de wacli.
--      Antes el `id` que devuelve `POST /leads` se descartaba, así que era
--      imposible medir el SLA en lugar de suponerlo por teléfono.
--   2. `rate_limit_buckets`: ventana fija en D1 para acotar el POST público.
--   3. Saneado: `occurred_at` aceptaba cualquier texto, y una fila inválida
--      hacía fallar el panel entero (ver el try/catch de summary.ts).

-- 1. Correlación clic <-> lead.
ALTER TABLE contact_events ADD COLUMN lead_id TEXT;

CREATE INDEX IF NOT EXISTS idx_contact_events_lead_id
  ON contact_events (lead_id);

-- 2. Ventana fija de rate limiting (contadores en D1).
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_reset_at
  ON rate_limit_buckets (reset_at);

-- 3. Saneado.
-- `occurred_at` solo debe ser una fecha ISO. Cualquier otra cosa se elimina:
-- esas filas rompían el panel, porque se formateaban sin try/catch.
DELETE FROM contact_events
 WHERE occurred_at NOT GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*';

-- Los user-agent se acotaban en el borde; las filas viejas se truncan acá.
UPDATE contact_events
   SET user_agent = SUBSTR(user_agent, 1, 256)
 WHERE LENGTH(user_agent) > 256;

-- Las fechas de expiración se guardan en ISO (con "T" y "Z"), no en el formato
-- de `datetime('now')`, así que la comparación tiene que usar el mismo formato.
DELETE FROM auth_codes
 WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

DELETE FROM panel_sessions
 WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
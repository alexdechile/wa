// File: functions/api/auth/verify-code.ts

import {
  MAX_CODE_ATTEMPTS,
  SESSION_TTL_MS,
  generateToken,
  getSecret,
  hmacHex,
  isSecureRequest,
  json,
  sessionCookie,
  timingSafeEqualHex,
} from '../../_lib/auth';

const INVALID = 'Código inválido o vencido';

/**
 * Paso 2 del acceso al panel: verificar el código y abrir sesión.
 *
 * Todos los fallos devuelven el mismo mensaje: no se distingue entre código
 * inexistente, vencido, consumido o equivocado.
 */
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  let email = '';
  let code = '';

  try {
    const payload = (await request.json()) as { email?: unknown; code?: unknown };
    if (typeof payload?.email === 'string') email = payload.email.trim().toLowerCase();
    if (typeof payload?.code === 'string') code = payload.code.trim();
  } catch {
    return json({ success: false, message: 'Solicitud inválida' }, 400);
  }

  if (!email || !/^\d{6}$/.test(code)) {
    return json({ success: false, message: INVALID }, 401);
  }

  if (!env.DB) {
    return json({ success: false, message: 'El panel no está configurado' }, 503);
  }

  const secret = getSecret(env);
  if (!secret) {
    return json({ success: false, message: 'El panel no está configurado' }, 503);
  }

  const row = await env.DB.prepare(
    `SELECT id, code_hash, attempts, expires_at
       FROM auth_codes
      WHERE email = ? AND consumed = 0
      ORDER BY created_at DESC
      LIMIT 1`,
  )
    .bind(email)
    .first<{ id: number; code_hash: string; attempts: number; expires_at: string }>();

  if (!row) return json({ success: false, message: INVALID }, 401);

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return json({ success: false, message: INVALID }, 401);
  }

  if (row.attempts >= MAX_CODE_ATTEMPTS) {
    return json({ success: false, message: INVALID }, 401);
  }

  const candidateHash = await hmacHex(secret, `${email}:${code}`);

  if (!timingSafeEqualHex(candidateHash, row.code_hash)) {
    // Se cuenta el intento fallido antes de responder.
    await env.DB.prepare('UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?')
      .bind(row.id)
      .run();
    return json({ success: false, message: INVALID }, 401);
  }

  // Éxito: el código se consume y nace la sesión.
  await env.DB.prepare('UPDATE auth_codes SET consumed = 1 WHERE id = ?')
    .bind(row.id)
    .run();

  const token = generateToken();
  const tokenHash = await hmacHex(secret, token);
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO panel_sessions (token_hash, email, expires_at, created_at)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(
      tokenHash,
      email,
      new Date(now + SESSION_TTL_MS).toISOString(),
      new Date(now).toISOString(),
    )
    .run();

  const secure = isSecureRequest(request);
  return json({ success: true, email }, 200, {
    'Set-Cookie': sessionCookie(token, Math.floor(SESSION_TTL_MS / 1000), secure),
  });
};

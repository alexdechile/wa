// File: functions/api/auth/request-code.ts

import {
  AUTHORIZED_EMAILS,
  CODE_TTL_MS,
  GENERIC_CODE_MESSAGE,
  MAX_CODES_PER_HOUR,
  generateCode,
  getSecret,
  hmacHex,
  json,
  sendWhatsApp,
} from '../../_lib/auth';

/**
 * Paso 1 del acceso al panel: pedir el código.
 *
 * La respuesta es **siempre la misma**, exista o no el correo, para no revelar
 * quién está autorizado.
 */
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  let email = '';

  try {
    const payload = (await request.json()) as { email?: unknown };
    if (typeof payload?.email === 'string') email = payload.email.trim().toLowerCase();
  } catch {
    return json({ success: false, message: 'Solicitud inválida' }, 400);
  }

  if (!email || !email.includes('@') || email.length > 254) {
    return json({ success: false, message: 'Ingresa un correo válido' }, 400);
  }

  if (!env.DB) {
    return json(
      { success: false, message: 'El panel no está configurado (falta la base D1)' },
      503,
    );
  }

  const secret = getSecret(env);
  if (!secret) {
    return json(
      { success: false, message: 'El panel no está configurado (falta el secreto)' },
      503,
    );
  }

  const phone = AUTHORIZED_EMAILS[email];
  if (!phone) {
    // Correo no autorizado: misma respuesta, sin enviar nada y sin crear código.
    return json({ success: true, message: GENERIC_CODE_MESSAGE }, 200);
  }

  const now = Date.now();

  // Límite de emisiones por correo para no spamear el WhatsApp de nadie.
  const windowStart = new Date(now - 60 * 60 * 1000).toISOString();
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS total FROM auth_codes WHERE email = ? AND created_at > ?',
  )
    .bind(email, windowStart)
    .first<{ total: number }>();

  if ((recent?.total ?? 0) >= MAX_CODES_PER_HOUR) {
    return json({ success: true, message: GENERIC_CODE_MESSAGE }, 200);
  }

  const code = generateCode();
  const codeHash = await hmacHex(secret, `${email}:${code}`);
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString();

  await env.DB.prepare(
    `INSERT INTO auth_codes (email, code_hash, expires_at, attempts, consumed, created_at)
     VALUES (?, ?, ?, 0, 0, ?)`,
  )
    .bind(email, codeHash, expiresAt, new Date(now).toISOString())
    .run();

  const text =
    `Tu código de acceso al panel de Comerza es *${code}*.\n` +
    `Vence en 10 minutos y sirve una sola vez.`;

  const sent = await sendWhatsApp(env, phone, text);
  if (!sent) {
    // No se filtra al cliente: puede ser el puente caído o la sesión de wacli
    // desconectada. Queda en el log para diagnóstico.
    console.error('No se pudo enviar el código por WhatsApp (revisar el puente de wacli)');
  }

  return json({ success: true, message: GENERIC_CODE_MESSAGE }, 200);
};

// File: functions/api/auth/logout.ts

import {
  SESSION_COOKIE,
  clearSessionCookie,
  hmacHex,
  isSecureRequest,
  json,
  parseCookies,
  getSecret,
} from '../../_lib/auth';

/**
 * Cierra la sesión del panel.
 *
 * No basta con borrar la cookie: la fila de `panel_sessions` seguía viva 12
 * horas con el mismo token, así que un token copiado seguía funcionando después
 * de "cerrar sesión". Ahora la fila se elimina en la base.
 */
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const secure = isSecureRequest(request);
  const headers: Record<string, string> = {
    'Set-Cookie': clearSessionCookie(secure),
  };

  try {
    const secret = getSecret(env);
    const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];

    if (secret && token && env.DB) {
      const tokenHash = await hmacHex(secret, token);
      await env.DB.prepare('DELETE FROM panel_sessions WHERE token_hash = ?')
        .bind(tokenHash)
        .run();
    }
  } catch (error) {
    // La cookie se limpia igual: el cierre de sesión nunca debe fallar visible.
    console.error('Error al revocar la sesión:', error);
  }

  return json({ success: true }, 200, headers);
};
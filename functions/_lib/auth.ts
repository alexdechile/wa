/**
 * Utilidades de autenticación del panel interno de Comerza.
 *
 * Flujo (ver openspec/proposals/comerza-door-experiment/spec.md):
 *   1. La persona pide acceso con su correo.
 *   2. Si está autorizada, se le envía un código de 6 dígitos por WhatsApp
 *      (a través del puente de wacli).
 *   3. Lo ingresa y se crea una sesión con cookie HttpOnly.
 *
 * Reglas:
 * - El flujo **no revela** si un correo está autorizado.
 * - Códigos: un solo uso, 10 minutos, máximo 5 intentos, HMAC con el secreto
 *   del servidor antes de guardarse.
 * - Sesiones: token aleatorio de 32 bytes, guardado como HMAC, 12 horas.
 */

/**
 * Personas autorizadas. El valor es su número de WhatsApp (E.164 sin "+").
 *
 * Son dos personas: Alex e Iván. `ventas@comerza.cl` es la misma persona que
 * `ivan@comerza.cl`, pero se deja fuera a propósito: la lista autorizada es de
 * dos correos exactos.
 */
export const AUTHORIZED_EMAILS: Record<string, string> = {
  'alex@comerza.cl': '56992215761',
  'ivan@comerza.cl': '56993206000',
};

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_CODES_PER_HOUR = 3;
export const MAX_CODE_ATTEMPTS = 5;
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'comerza_panel';

/** Respuesta idéntica exista o no el correo: evita enumerar autorizados. */
export const GENERIC_CODE_MESSAGE =
  'Si el correo está autorizado, recibirás un código por WhatsApp en unos segundos.';

export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Código de 6 dígitos generado con la CSPRNG del runtime. */
export function generateCode(): string {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, '0');
}

/** Token de sesión: 32 bytes aleatorios en hexadecimal. */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(value),
  );
  return toHex(signature);
}

/** Comparación en tiempo constante para cadenas hexadecimales. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length === 0 || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

function cookieAttributes(maxAgeSeconds: number, secure: boolean): string {
  return [
    `Path=/`,
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function sessionCookie(
  token: string,
  maxAgeSeconds: number,
  secure: boolean,
): string {
  return `${SESSION_COOKIE}=${token}; ${cookieAttributes(maxAgeSeconds, secure)}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; ${cookieAttributes(0, secure)}`;
}

export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

/** Secreto de servidor para HMAC y para hablar con el puente. */
export function getSecret(env: Env): string | null {
  return env.BRIDGE_TOKEN && env.BRIDGE_TOKEN.length >= 24 ? env.BRIDGE_TOKEN : null;
}

/** Envía un WhatsApp a través del puente de wacli. */
export async function sendWhatsApp(
  env: Env,
  chatId: string,
  text: string,
  timeoutMs = 8000,
): Promise<boolean> {
  if (!env.BRIDGE_URL || !env.BRIDGE_TOKEN) return false;

  try {
    const response = await fetch(
      `${env.BRIDGE_URL.replace(/\/+$/, '')}/messages/text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.BRIDGE_TOKEN}`,
        },
        body: JSON.stringify({ chatId, text }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}

/** Consulta la salud del puente. Devuelve `null` si no es alcanzable. */
export async function fetchBridgeHealth(
  env: Env,
  timeoutMs = 3000,
): Promise<{ connected: boolean; authenticated: boolean } | null> {
  if (!env.BRIDGE_URL || !env.BRIDGE_TOKEN) return null;

  try {
    const response = await fetch(
      `${env.BRIDGE_URL.replace(/\/+$/, '')}/health`,
      {
        headers: { Authorization: `Bearer ${env.BRIDGE_TOKEN}` },
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!response.ok) return null;
    const health = (await response.json()) as {
      connected?: boolean;
      authenticated?: boolean;
    };
    return {
      connected: health.connected === true,
      authenticated: health.authenticated === true,
    };
  } catch {
    return null;
  }
}

/** Devuelve el correo de la sesión válida, o `null`. */
export async function getSessionEmail(
  env: Env,
  request: Request,
): Promise<string | null> {
  if (!env.DB) return null;

  const secret = getSecret(env);
  if (!secret) return null;

  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
  if (!token) return null;

  const tokenHash = await hmacHex(secret, token);
  const row = await env.DB.prepare(
    'SELECT email, expires_at FROM panel_sessions WHERE token_hash = ?',
  )
    .bind(tokenHash)
    .first<{ email: string; expires_at: string }>();

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  return row.email;
}

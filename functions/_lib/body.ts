// File: functions/_lib/body.ts

/**
 * Lectura acotada de cuerpos JSON.
 *
 * Todos los endpoints públicos de `wa` reciben JSON pequeño y de forma fija
 * (un botón, un correo, un código). Antes se hacía `await request.json()` sin
 * tope: un cuerpo de varios MB se parseaba completo dentro del Worker, gastando
 * CPU y memoria del edge para nada. No es ejecución de código, pero es una vía
 * barata de degradar el servicio.
 *
 * Reglas:
 * - Si el cliente declara `Content-Length` mayor al tope, se rechaza **antes**
 *   de leer el cuerpo (camino barato, corta el abuso típico).
 * - Igual se mide el cuerpo real: `Content-Length` puede faltar o mentir.
 * - El tamaño se cuenta en **bytes UTF-8**, no en `text.length` (que cuenta
 *   unidades UTF-16 y subestima acentos y emojis).
 *
 * Límite conocido: Workers ya acota el cuerpo a nivel de plataforma (órdenes de
 * MB), así que el peor caso no es memoria infinita sino trabajo innecesario.
 */

/** Los tres endpoints usan cuerpos de menos de 200 bytes. 2 KB es holgado. */
export const MAX_JSON_BYTES = 2048;

export type JsonBodyResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'too_large' | 'invalid' };

/** Plural de "límite excedido" para mensajes de error homogéneos. */
export const TOO_LARGE_MESSAGE = 'Solicitud demasiado grande';

export async function readJsonBody<T>(
  request: Request,
  maxBytes: number = MAX_JSON_BYTES,
): Promise<JsonBodyResult<T>> {
  const declared = request.headers.get('content-length');
  if (declared !== null) {
    const size = Number(declared);
    if (!Number.isFinite(size) || size < 0) return { ok: false, reason: 'invalid' };
    if (size > maxBytes) return { ok: false, reason: 'too_large' };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, reason: 'too_large' };
  }

  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

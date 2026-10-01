/**
 * Rate limiting de ventana fija sobre D1.
 *
 * `/api/track` es público y sin sesión: sin este control, cualquiera puede
 * inundar la tabla de telemetría y, peor, disparar el lazo de supervisión del
 * host, que alerta por WhatsApp al supervisor. Cloudflare tiene rate limiting
 * en el edge, pero como función de dependencia externa (y con límites de plan)
 * conviene no depender de él para lo que protege al negocio.
 *
 * El contador es una fila por clave con un `reset_at`. La operación es un solo
 * `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`, que D1 ejecuta de forma
 * atómica, así que no hay ventana de lectura-modificación-escritura.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Veces que ya se consumió en la ventana, incluido este intento. */
  hits: number;
  /** Epoch en ms en que se reinicia la ventana. */
  resetAt: number;
}

/**
 * Suma un golpe a la ventana de `bucketKey` y dice si está dentro del límite.
 *
 * Las ventanas no se alinean a bordes fijos: cada clave lleva su propio
 * `reset_at`, así que un cliente que va justo en el límite no queda premiado
 * por unlucky timing.
 */
export async function consumeFixedWindow(
  db: D1Database,
  bucketKey: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const resetAt = now + windowMs;

  const row = await db
    .prepare(
      `INSERT INTO rate_limit_buckets (bucket_key, hits, reset_at)
       VALUES (?, 1, ?)
       ON CONFLICT(bucket_key) DO UPDATE SET
         hits = CASE
           WHEN rate_limit_buckets.reset_at <= ? THEN 1
           ELSE rate_limit_buckets.hits + 1
         END,
         reset_at = CASE
           WHEN rate_limit_buckets.reset_at <= ? THEN excluded.reset_at
           ELSE rate_limit_buckets.reset_at
         END
       RETURNING hits, reset_at`,
    )
    .bind(bucketKey, resetAt, now, now)
    .first<{ hits: number; reset_at: number }>();

  const hits = Number(row?.hits ?? 1);
  const effectiveResetAt = Number(row?.reset_at ?? resetAt);

  return { allowed: hits <= limit, hits, resetAt: effectiveResetAt };
}

/**
 * Identificador del cliente para agrupar sus golpes.
 *
 * `request.cf.clientIp` lo resuelve Cloudflare en el edge y no lo puede
 * falsear el cliente. Cuando no está (pruebas locales, algunos entornos), se
 * usa un cubo global compartido: es más estricto que no limitar nada.
 */
export function clientKey(request: IncomingRequest): string {
  const ip = request.cf?.clientIp;
  return ip ? `ip:${ip}` : 'ip:unknown';
}

/** Segundos que faltan para que la ventana se libere, como los pide `Retry-After`. */
export function retryAfterSeconds(resetAt: number, now: number = Date.now()): number {
  return Math.max(1, Math.ceil((resetAt - now) / 1000));
}
/**
 * Cliente del puente de wacli (repositorio `bim`).
 *
 * El enrutador en Cloudflare no puede hablar con wacli directamente: wacli vive
 * en el host, detrás del túnel, y se expone por un HTTP autenticado con un token
 * compartido. Todo el tráfico sale desde el servidor: el token **nunca** llega
 * al navegador.
 */

function bridgeBase(env: Env): { url: string; token: string } | null {
  if (!env.BRIDGE_URL || !env.BRIDGE_TOKEN) return null;
  return { url: env.BRIDGE_URL.replace(/\/+$/, ''), token: env.BRIDGE_TOKEN };
}

async function callBridge(
  env: Env,
  path: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response | null> {
  const base = bridgeBase(env);
  if (!base) return null;

  try {
    return await fetch(`${base.url}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${base.token}`,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return null;
  }
}

/** Envía un WhatsApp a través del puente. */
export async function sendWhatsApp(
  env: Env,
  chatId: string,
  text: string,
  timeoutMs = 8000,
): Promise<boolean> {
  const response = await callBridge(
    env,
    '/messages/text',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, text }),
    },
    timeoutMs,
  );
  return response?.ok === true;
}

/** Consulta la salud del puente. Devuelve `null` si no es alcanzable. */
export async function fetchBridgeHealth(
  env: Env,
  timeoutMs = 3000,
): Promise<{ connected: boolean; authenticated: boolean } | null> {
  const response = await callBridge(env, '/health', { method: 'GET' }, timeoutMs);
  if (!response?.ok) return null;

  try {
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

export interface LeadNotification {
  trigger: 'T1' | 'T2' | 'T3';
  button?: string;
  detectedAt?: string;
}

/**
 * Avisa al puente que alguien se dirigió a la línea humana.
 *
 * El lazo de supervisión del host es quien alerta al supervisor; aquí solo se
 * registra el hecho. Un fallo de aviso no debe afectar al cliente, así que el
 * llamador lo dispara sin bloquear la respuesta.
 */
export async function notifyLead(
  env: Env,
  lead: LeadNotification,
  timeoutMs = 5000,
): Promise<boolean> {
  const response = await callBridge(
    env,
    '/leads',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'router_click', ...lead }),
    },
    timeoutMs,
  );
  return response?.ok === true;
}

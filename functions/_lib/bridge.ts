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
  /**
   * Hilo de correlación que el puente ya aceptaba y nunca se usó. Acá lleva
   * `wa:evt:<id del evento>`, que es lo que permite unir el clic de D1 con el
   * lead que quedó registrado en el SQLite del host.
   */
  clientRef?: string;
}

export interface BridgeLead {
  id: string;
  detectedAt: string;
  trigger: string;
  source: string;
  button?: string | null;
  status: string;
  /** Hilo de correlación con el clic que lo originó, si viene del enrutador. */
  clientRef?: string | null;
  alertedAt?: string | null;
  remindedAt?: string | null;
  escalatedAt?: string | null;
  confirmedAt?: string | null;
  closedAt?: string | null;
  confirmedBy?: string | null;
}

/**
 * Leads abiertos del lazo de supervisión.
 *
 * Devuelve `null` si el puente no responde: el panel debe poder distinguir
 * "no hay leads" de "no se pudo consultar".
 */
export async function fetchOpenLeads(
  env: Env,
  timeoutMs = 4000,
): Promise<BridgeLead[] | null> {
  const response = await callBridge(env, '/leads', { method: 'GET' }, timeoutMs);
  if (!response?.ok) return null;

  try {
    const body = (await response.json()) as { leads?: BridgeLead[] };
    return body.leads ?? [];
  } catch {
    return null;
  }
}

/**
 * Avisa al puente que alguien se dirigió a la línea humana.
 *
 * El lazo de supervisión del host es quien alerta al supervisor; aquí solo se
 * registra el hecho. Devuelve el `id` del lead creado para poder correlacionarlo
 * con el clic en D1, o `null` si el puente no respondió. Un fallo de aviso no
 * debe afectar al cliente, así que el llamador lo dispara sin bloquear.
 */
export async function notifyLead(
  env: Env,
  lead: LeadNotification,
  timeoutMs = 5000,
): Promise<string | null> {
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

  if (!response?.ok) return null;

  try {
    // El puente responde 201 { id }.
    const body = (await response.json()) as { id?: unknown };
    return typeof body.id === 'string' && body.id ? body.id : null;
  } catch {
    return null;
  }
}

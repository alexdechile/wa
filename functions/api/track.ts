// File: functions/api/track.ts

/**
 * Telemetría de clics del enrutador.
 *
 * Este endpoint es público y no tiene sesión, así que **nada de lo que llega
 * desde el cliente se toma como verdad**: el horario se recalcula en el
 * servidor y la línea de destino se deriva del botón. Antes venía
 * `targetLine` en el cuerpo y el servidor le creía, con lo que un POST cualquiera
 * podía disparar el lazo de supervisión del host y alertar por WhatsApp al
 * supervisor.
 */

import type { ContactButtonType } from '../../types';
import { deriveTargetLine, isHumanLineLead, leadTrigger } from '../../lib/routing';
import { getTimeInfo } from '../_lib/schedule';
import { clientKey, consumeFixedWindow, retryAfterSeconds } from '../_lib/ratelimit';
import { notifyLead } from '../_lib/bridge';

const VALID_BUTTONS: ContactButtonType[] = ['store', 'support', 'sales', 'materials', 'email'];

/** Un user-agent de 100 KB no es información útil y entra completo a D1. */
const MAX_USER_AGENT_LENGTH = 256;

/** Clices por IP. Un usuario real no pasa de unos pocos por minuto. */
const TRACK_LIMIT = 30;
const TRACK_WINDOW_MS = 60 * 1000;

/** Leads por IP. Uno cada 10 minutos alcanza para un caso legítimo. */
const LEAD_LIMIT = 3;
const LEAD_WINDOW_MS = 10 * 60 * 1000;

function json(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// This is a Cloudflare Pages function that handles POST requests
export const onRequestPost: PagesFunction = async ({ request, env, waitUntil }) => {
  let payload: Record<string, unknown>;

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return json({ success: false, message: 'Invalid request body' }, 400);
    }
    payload = body as Record<string, unknown>;
  } catch {
    return json({ success: false, message: 'Invalid request body' }, 400);
  }

  if (typeof payload.button !== 'string' || !VALID_BUTTONS.includes(payload.button as ContactButtonType)) {
    return json({ success: false, message: 'Unknown button' }, 400);
  }
  const button = payload.button as ContactButtonType;

  // El reloj y el horario son del servidor. El `isHumanHours` y el `targetLine`
  // que mandaba el cliente se ignoran por completo: se derivan acá.
  const now = new Date();
  const occurredAt = now.toISOString();
  const time = getTimeInfo(now);
  const targetLine = deriveTargetLine(button, time.isHumanHours);

  // Sin D1 no hay forma de acotar nada, así que tampoco se generan leads: es
  // preferible no alertar a un supervisor clásico a dejar la línea abierta.
  if (!env.DB) {
    console.log('track (sin D1):', { button, occurredAt, targetLine });
    return json({ success: true, stored: false, message: 'Tracked to logs only' }, 200);
  }

  const key = clientKey(request);

  const trackLimit = await consumeFixedWindow(env.DB, `track:${key}`, TRACK_LIMIT, TRACK_WINDOW_MS);
  if (!trackLimit.allowed) {
    return json({ success: false, message: 'Demasiadas solicitudes' }, 429, {
      'Retry-After': String(retryAfterSeconds(trackLimit.resetAt)),
    });
  }

  const rawUserAgent = request.headers.get('user-agent');
  const userAgent = rawUserAgent ? rawUserAgent.slice(0, MAX_USER_AGENT_LENGTH) : null;

  let rowId: number | null = null;

  try {
    const result = await env.DB.prepare(
      `INSERT INTO contact_events
         (occurred_at, button, is_human_hours, is_lunch_break, target_line, country, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        occurredAt,
        button,
        time.isHumanHours ? 1 : 0,
        time.isLunchBreak ? 1 : 0,
        targetLine,
        request.cf?.country ?? null,
        userAgent,
      )
      .run();

    rowId = Number(result?.meta?.last_row_id ?? 0) || null;
  } catch (error) {
    // Un fallo de telemetría nunca debe romper la experiencia del cliente.
    console.error('Error storing tracking event:', error);
    return json({ success: true, stored: false, message: 'Storage failed' }, 200);
  }

  // Un lead es un clic que se dirigió a la línea HUMANA por un botón que
  // genera requerimiento. Los clics que van al asistente no generan alerta:
  // los atiende wacli.
  if (isHumanLineLead(button, time.isHumanHours) && rowId !== null) {
    const leadLimit = await consumeFixedWindow(
      env.DB,
      `lead:${key}`,
      LEAD_LIMIT,
      LEAD_WINDOW_MS,
    );

    if (leadLimit.allowed) {
      // `clientRef` es el hilo que ya existía en el puente para correlacionar y
      // que nunca se usó: sin él no había forma de unir el clic con su lead.
      const clientRef = `wa:evt:${rowId}`;

      waitUntil(
        notifyLead(env, {
          trigger: leadTrigger(button),
          button,
          detectedAt: occurredAt,
          clientRef,
        })
          .then(async (leadId) => {
            if (!leadId) return;
            await env.DB!.prepare('UPDATE contact_events SET lead_id = ? WHERE id = ?')
              .bind(leadId, rowId)
              .run();
          })
          .catch(() => undefined),
      );
    }
  }

  return json({ success: true, stored: true }, 200);
};
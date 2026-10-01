// File: functions/api/panel/summary.ts

import { fetchBridgeHealth, getSessionEmail, json } from '../../_lib/auth';
import { fetchOpenLeads, type BridgeLead } from '../../_lib/bridge';

interface ContactEventRow {
  id: number;
  occurred_at: string;
  button: string;
  is_human_hours: number;
  is_lunch_break: number;
  target_line: string | null;
  country: string | null;
  lead_id: string | null;
}

/**
 * Tope de filas leídas para el resumen.
 *
 * El agregado se hace en memoria, así que este número es también el techo de
 * lo que el panel sabe contar. Con más clics que esto en la ventana, los
 * números quedan bajos: por eso la respuesta lleva `truncated` para que el
 * panel lo diga en vez de mentir en silencio.
 */
const SUMMARY_ROW_LIMIT = 2000;

/** `true` si el texto tiene forma de fecha ISO y es parseable. */
function isIsoTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

const DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Resumen del día para el panel interno. Requiere sesión válida.
 *
 * Solo devuelve **metadatos de clics**: botón, horario, línea de destino, país.
 * Nunca contenido de conversaciones.
 */
export const onRequestGet: PagesFunction = async ({ request, env }) => {
  if (!env.DB) {
    return json({ error: 'Base no configurada' }, 503);
  }

  const email = await getSessionEmail(env, request);
  if (!email) {
    return json({ error: 'No autorizado' }, 401);
  }

  const today = DAY_FORMATTER.format(new Date());
  // 36 h de margen cubren cualquier desfase por horario de verano; el filtro
  // fino por día de Santiago se hace abajo.
  const since = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

  // El filtro por forma de fecha va en SQL, no después: una fila con
  // `occurred_at` ilegible (que antes se aceptaba sin validar) hacía que
  // `Intl.DateTimeFormat.format` tirara `RangeError` y el panel entero quedara
  // en 500 de forma permanente, porque la fila envenenada se quedaba guardada.
  const { results } = await env.DB.prepare(
    `SELECT id, occurred_at, button, is_human_hours, is_lunch_break, target_line, country, lead_id
       FROM contact_events
      WHERE occurred_at >= ?
        AND occurred_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T*'
      ORDER BY occurred_at DESC
      LIMIT ${SUMMARY_ROW_LIMIT}`,
  )
    .bind(since)
    .all<ContactEventRow>();

  // Última defensa en JS: aunque el patrón calce, la fecha puede ser inválida.
  const todayEvents = (results ?? []).filter((row) => {
    if (!isIsoTimestamp(row.occurred_at)) return false;
    try {
      return DAY_FORMATTER.format(new Date(row.occurred_at)) === today;
    } catch {
      return false;
    }
  });

  const byButton: Record<string, number> = {};
  let lunch = 0;
  let outOfHours = 0;
  let toHuman = 0;
  let toAssistant = 0;

  for (const row of todayEvents) {
    byButton[row.button] = (byButton[row.button] ?? 0) + 1;
    if (row.is_lunch_break) lunch += 1;
    if (row.is_human_hours === 0) outOfHours += 1;
    if (row.target_line === 'human') toHuman += 1;
    if (row.target_line === 'assistant') toAssistant += 1;
  }

  const bridge = await fetchBridgeHealth(env);
  const openLeads = await fetchOpenLeads(env);

  // Índice id -> evento, para resolver el `clientRef` que manda el puente
  // (`wa:evt:<id>`). Con esto cada lead abierto muestra el país y la hora del
  // clic que lo originó, en vez de quedar como una fila huérfana.
  const eventsById = new Map<number, ContactEventRow>();
  for (const row of results ?? []) {
    eventsById.set(row.id, row);
  }

  function clickFor(lead: BridgeLead): ContactEventRow | undefined {
    if (!lead.clientRef) return undefined;
    const match = /^wa:evt:(\d+)$/.exec(lead.clientRef);
    if (!match) return undefined;
    return eventsById.get(Number(match[1]));
  }

  return json({
    email,
    date: today,
    total: todayEvents.length,
    // Si se topó el límite de filas, los números de arriba son un piso, no el
    // total. El panel lo muestra en vez de reportar menos como si fuera todo.
    truncated: (results ?? []).length >= SUMMARY_ROW_LIMIT,
    byButton,
    lunch,
    outOfHours,
    toHuman,
    toAssistant,
    // Un cero debe poder distinguirse de una falla: `bridge: null` significa
    // "no se pudo consultar", no "el canal está sano".
    bridge,
    supervision: {
      // `reachable: false` = no se pudo consultar. Distinto de "sin leads".
      reachable: openLeads !== null,
      openCount: (openLeads ?? []).length,
      awaitingConfirmation: (openLeads ?? []).filter(
        (lead) => lead.status === 'alerta_enviada',
      ).length,
      leads: (openLeads ?? []).slice(0, 10).map((lead) => {
        const click = clickFor(lead);
        return {
          id: lead.id,
          detectedAt: lead.detectedAt,
          button: lead.button ?? null,
          status: lead.status,
          // Presente solo si el clic sigue en la ventana consultada: el lead
          // vive en el SQLite del host y el clic en D1, y no comparten historial.
          country: click?.country ?? null,
          clickedAt: click?.occurred_at ?? null,
        };
      }),
    },
    latest: todayEvents.slice(0, 15).map((row) => ({
      at: row.occurred_at,
      button: row.button,
      targetLine: row.target_line,
      country: row.country,
      outOfHours: row.is_human_hours === 0,
      leadId: row.lead_id ?? null,
    })),
  });
};

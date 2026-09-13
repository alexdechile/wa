// File: functions/api/panel/summary.ts

import { fetchBridgeHealth, getSessionEmail, json } from '../../_lib/auth';
import { fetchOpenLeads } from '../../_lib/bridge';

interface ContactEventRow {
  occurred_at: string;
  button: string;
  is_human_hours: number;
  is_lunch_break: number;
  target_line: string | null;
  country: string | null;
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

  const { results } = await env.DB.prepare(
    `SELECT occurred_at, button, is_human_hours, is_lunch_break, target_line, country
       FROM contact_events
      WHERE occurred_at >= ?
      ORDER BY occurred_at DESC
      LIMIT 500`,
  )
    .bind(since)
    .all<ContactEventRow>();

  const todayEvents = (results ?? []).filter(
    (row) => DAY_FORMATTER.format(new Date(row.occurred_at)) === today,
  );

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

  return json({
    email,
    date: today,
    total: todayEvents.length,
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
      leads: (openLeads ?? []).slice(0, 10).map((lead) => ({
        id: lead.id,
        detectedAt: lead.detectedAt,
        button: lead.button ?? null,
        status: lead.status,
      })),
    },
    latest: todayEvents.slice(0, 15).map((row) => ({
      at: row.occurred_at,
      button: row.button,
      targetLine: row.target_line,
      country: row.country,
      outOfHours: row.is_human_hours === 0,
    })),
  });
};

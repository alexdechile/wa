// File: functions/api/track.ts

import type { ContactButtonType, TargetLine } from '../../types';

interface TrackPayload {
  button: ContactButtonType;
  isHumanHours: boolean;
  isLunchBreak?: boolean;
  targetLine?: TargetLine;
  timestamp?: string;
}

const VALID_BUTTONS: ContactButtonType[] = ['store', 'support', 'sales', 'materials', 'email'];
const VALID_TARGETS: TargetLine[] = ['web', 'human', 'assistant', 'email'];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// This is a Cloudflare Pages function that handles POST requests
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  let payload: TrackPayload;

  try {
    payload = (await request.json()) as TrackPayload;
  } catch {
    return json({ success: false, message: 'Invalid request body' }, 400);
  }

  if (!payload || !VALID_BUTTONS.includes(payload.button)) {
    return json({ success: false, message: 'Unknown button' }, 400);
  }

  const targetLine =
    payload.targetLine && VALID_TARGETS.includes(payload.targetLine)
      ? payload.targetLine
      : null;

  const record = {
    timestamp:
      typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
    button: payload.button,
    isHumanHours: payload.isHumanHours === true,
    isLunchBreak: payload.isLunchBreak === true,
    targetLine,
    country: request.cf?.country ?? null,
    userAgent: request.headers.get('user-agent') ?? null,
  };

  // Sin binding D1 la telemetría solo queda en logs. Es deliberado: el enrutador
  // debe seguir funcionando aunque la base no esté configurada.
  if (!env.DB) {
    console.log('track (sin D1):', record);
    return json({ success: true, stored: false, message: 'Tracked to logs only' }, 200);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO contact_events
         (occurred_at, button, is_human_hours, is_lunch_break, target_line, country, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        record.timestamp,
        record.button,
        record.isHumanHours ? 1 : 0,
        record.isLunchBreak ? 1 : 0,
        record.targetLine,
        record.country,
        record.userAgent
      )
      .run();

    return json({ success: true, stored: true }, 200);
  } catch (error) {
    // Un fallo de telemetría nunca debe romper la experiencia del cliente.
    console.error('Error storing tracking event:', error);
    return json({ success: true, stored: false, message: 'Storage failed' }, 200);
  }
};

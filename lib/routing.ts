/**
 * Enrutamiento de un clic a su línea de atención.
 *
 * Este archivo es la **única** fuente de la regla, y lo usan los dos lados:
 * el frontend para armar el link de WhatsApp, y la función de edge para decidir
 * a qué línea se le avisa al supervisor. Antes la regla vivía solo en el
 * navegador (`App.tsx`), y el servidor le creía al `targetLine` que mandaba el
 * cliente: cualquiera podía declarar que era horario hábil.
 */

import type { ContactButtonType, TargetLine } from '../types';

/**
 * Botones que generan un lead cuando caen en la línea humana.
 *
 * `materials` va siempre al asistente, así que nunca genera lead, aunque sea
 * horario hábil: la lista de materiales la pide y responde el asistente.
 */
export function isLeadButton(button: ContactButtonType): boolean {
  return button === 'sales' || button === 'support';
}

/** Línea a la que va un clic, según el botón y si hay alguien atendiendo. */
export function deriveTargetLine(
  button: ContactButtonType,
  isHumanHours: boolean,
): TargetLine {
  if (button === 'store') return 'web';
  if (button === 'email') return 'email';
  if (button === 'materials') return 'assistant';
  return isHumanHours ? 'human' : 'assistant';
}

/** `true` si el clic fue a la línea humana por un botón que genera lead. */
export function isHumanLineLead(
  button: ContactButtonType,
  isHumanHours: boolean,
): boolean {
  return isHumanHours && isLeadButton(button);
}

/**
 * Trigger del protocolo de supervisión para un botón.
 *
 * T1 = venta explícita, T2 = soporte. El puente acepta T3 y hoy no se emite:
 * queda reservado para un tipo de requerimiento que aún no existe.
 */
export function leadTrigger(button: ContactButtonType): 'T1' | 'T2' {
  return button === 'sales' ? 'T1' : 'T2';
}
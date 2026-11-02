/**
 * Enrutamiento de un clic a su línea de atención.
 *
 * Este archivo es la **única** fuente de la regla, y lo usan los dos lados:
 * el frontend para armar el link de WhatsApp, y la función de edge para decidir
 * a qué línea se le avisa al supervisor. Antes la regla vivía solo en el
 * navegador (`App.tsx`), y el servidor le creía al `targetLine` que mandaba el
 * cliente: cualquiera podía declarar que era horario hábil.
 *
 * Desde 2026-11-02 el cliente **no cambia de número según la hora**. Antes, fuera
 * de horario, los botones lo mandaban al asistente (56226832189), que prometía
 * atención y no la daba: el mensaje quedaba en una conversación que nadie
 * miraba. Ahora todo el tráfico de conversación va a la línea del vendedor
 * (56226830645), donde un respondedor automático entrega la dirección y el
 * horario al instante, a cualquier hora, y el requerimiento espera ahí mismo.
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

/**
 * Línea a la que va un clic.
 *
 * `isHumanHours` ya no cambia el destino —se sigue recibiendo porque la firma la
 * comparten el navegador y el edge— pero se deja explícito para que nadie
 * reintroduzca el salto al asistente sin entender por qué se quitó.
 */
export function deriveTargetLine(
  button: ContactButtonType,
  isHumanHours: boolean,
): TargetLine {
  if (button === 'store') return 'web';
  if (button === 'email') return 'email';
  if (button === 'materials') return 'assistant';
  void isHumanHours;
  return 'human';
}

/**
 * `true` si el clic merece que el supervisor despierte a alguien.
 *
 * Sigue dependiendo del horario, y a propósito: el destino del mensaje ya es la
 * línea humana a cualquier hora, pero avisar a un supervisor a las 2 de la
 * mañana no sirve — no hay a quién despertar. El requerimiento igual queda
 * registrado y esperando en la conversación del vendedor.
 */
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
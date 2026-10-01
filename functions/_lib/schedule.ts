/**
 * Horario de atención humana de Comerza (America/Santiago).
 *
 * Regla de negocio (ver openspec/proposals/comerza-door-experiment/spec.md):
 * la atención humana es de 8:30 a 13:00 y de 14:00 a 17:30. La **pausa de
 * almuerzo cuenta como fuera de horario**, porque no hay nadie atendiendo.
 *
 * `isHumanHours` es la señal de **enrutamiento**, no de disponibilidad total:
 * fuera de horario el enrutador deriva al asistente (línea de wacli), que sí
 * responde.
 *
 * Esta lógica vive acá y no dentro de `api/time.ts` porque el servidor la
 * necesita para dos cosas que no son "responder qué hora es":
 *
 *   - `api/time.ts`, que la publica para el frontend.
 *   - `api/track.ts`, que **recalcula** el horario en vez de creerle al
 *     navegador. Antes el cliente declaraba `isHumanHours` y `targetLine`, y
 *     con eso decidía a qué línea se le avisa al supervisor.
 */

export interface TimeInfo {
  isHumanHours: boolean;
  /** true solo si es día hábil y estamos dentro de la pausa de almuerzo. */
  isLunchBreak: boolean;
  statusMessage: string;
  scheduleMessage: string;
}

// Ventanas de atención, en minutos desde medianoche (hora de Santiago).
export const MORNING_START = 8 * 60 + 30; // 08:30
export const MORNING_END = 13 * 60; // 13:00
export const AFTERNOON_START = 14 * 60; // 14:00
export const AFTERNOON_END = 17 * 60 + 30; // 17:30

/** Día hábil y minutos transcurridos en Santiago, para una fecha dada. */
export function santiagoClock(now: Date): {
  isWeekday: boolean;
  minutes: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(now);
  const getPartValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const day = getPartValue('weekday');
  const hour = Number.parseInt(getPartValue('hour'), 10);
  const minute = Number.parseInt(getPartValue('minute'), 10);

  const isWeekday = !['Sat', 'Sun'].includes(day);
  // `formatToParts` con hourCycle h23 siempre entrega números; el fallback es
  // solo para que un runtime raro no produzca NaN en silencio.
  const minutes = Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : 0;

  return { isWeekday, minutes };
}

/** Estado de atención en Santiago para una fecha dada. */
export function getTimeInfo(now: Date = new Date()): TimeInfo {
  const { isWeekday, minutes } = santiagoClock(now);

  const isMorning = minutes >= MORNING_START && minutes < MORNING_END;
  const isAfternoon = minutes >= AFTERNOON_START && minutes < AFTERNOON_END;
  const isHumanHours = isWeekday && (isMorning || isAfternoon);
  const isLunchBreak = isWeekday && minutes >= MORNING_END && minutes < AFTERNOON_START;

  if (isHumanHours) {
    return {
      isHumanHours: true,
      isLunchBreak: false,
      statusMessage: 'Estamos atendiendo',
      scheduleMessage: 'Lunes a viernes de 8:30 a 13:00 y de 14:00 a 17:30',
    };
  }

  if (isLunchBreak) {
    return {
      isHumanHours: false,
      isLunchBreak: true,
      statusMessage: 'Estamos en pausa de almuerzo',
      scheduleMessage: 'Nuestro asistente te responde ahora mismo',
    };
  }

  return {
    isHumanHours: false,
    isLunchBreak: false,
    statusMessage: 'Fuera de horario de atención',
    scheduleMessage:
      'Nuestro asistente te responde ahora; en horario hábil te contacta una persona',
  };
}
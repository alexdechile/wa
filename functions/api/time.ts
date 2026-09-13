// File: functions/api/time.ts

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
 */

interface TimeInfo {
  isHumanHours: boolean;
  /** true solo si es día hábil y estamos dentro de la pausa de almuerzo. */
  isLunchBreak: boolean;
  statusMessage: string;
  scheduleMessage: string;
}

// Ventanas de atención, en minutos desde medianoche (hora de Santiago).
const MORNING_START = 8 * 60 + 30; // 08:30
const MORNING_END = 13 * 60; // 13:00
const AFTERNOON_START = 14 * 60; // 14:00
const AFTERNOON_END = 17 * 60 + 30; // 17:30

// This is a Cloudflare Pages function
export const onRequestGet: PagesFunction = async () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Santiago',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);

  const getPartValue = (type: string) => parts.find(p => p.type === type)?.value || '';

  const day = getPartValue('weekday');
  const hour = parseInt(getPartValue('hour'), 10);
  const minute = parseInt(getPartValue('minute'), 10);

  const isWeekday = !['Sat', 'Sun'].includes(day);
  const timeInMinutes = hour * 60 + minute;

  const isMorning = timeInMinutes >= MORNING_START && timeInMinutes < MORNING_END;
  const isAfternoon = timeInMinutes >= AFTERNOON_START && timeInMinutes < AFTERNOON_END;
  const isHumanHours = isWeekday && (isMorning || isAfternoon);
  const isLunchBreak =
    isWeekday && timeInMinutes >= MORNING_END && timeInMinutes < AFTERNOON_START;

  let timeInfo: TimeInfo;

  if (isHumanHours) {
    timeInfo = {
      isHumanHours: true,
      isLunchBreak: false,
      statusMessage: 'Estamos atendiendo',
      scheduleMessage: 'Lunes a viernes de 8:30 a 13:00 y de 14:00 a 17:30',
    };
  } else if (isLunchBreak) {
    timeInfo = {
      isHumanHours: false,
      isLunchBreak: true,
      statusMessage: 'Estamos en pausa de almuerzo',
      scheduleMessage: 'Nuestro asistente te responde ahora mismo',
    };
  } else {
    timeInfo = {
      isHumanHours: false,
      isLunchBreak: false,
      statusMessage: 'Fuera de horario de atención',
      scheduleMessage: 'Nuestro asistente te responde ahora; en horario hábil te contacta una persona',
    };
  }

  return new Response(JSON.stringify(timeInfo), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60', // Cache for 1 minute
    },
  });
};

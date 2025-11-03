// File: functions/api/time.ts

interface TimeInfo {
  isHumanHours: boolean;
  statusMessage: string;
  scheduleMessage: string;
}

// This is a Cloudflare Pages function
export const onRequestGet: PagesFunction = async () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Santiago',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);

  const getPartValue = (type: string) => parts.find(p => p.type === type)?.value || '';

  const day = getPartValue('weekday');
  const hour = parseInt(getPartValue('hour'), 10);
  const minute = parseInt(getPartValue('minute'), 10);
  
  const isWeekday = !['Sat', 'Sun'].includes(day);
  const timeInMinutes = hour * 60 + minute;
  const startMinutes = 8 * 60 + 30; // 8:30
  const endMinutes = 17 * 60 + 30; // 17:30

  const isWithinHours = isWeekday && timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
  
  let timeInfo: TimeInfo;

  if (isWithinHours) {
    timeInfo = {
      isHumanHours: true,
      statusMessage: 'Estamos atendiendo',
      scheduleMessage: 'Lunes a Viernes de 8:30 a 17:30'
    };
  } else {
    timeInfo = {
      isHumanHours: false,
      statusMessage: 'Fuera de horario de atención',
      scheduleMessage: 'Te responderemos cuando estemos disponibles'
    };
  }

  return new Response(JSON.stringify(timeInfo), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60' // Cache for 1 minute
    },
  });
};
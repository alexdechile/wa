import { useState, useEffect } from 'react';

interface ChileanTime {
  isHumanHours: boolean;
  statusMessage: string;
  scheduleMessage: string;
}

export const useChileanTime = (): ChileanTime => {
  const [timeInfo, setTimeInfo] = useState<ChileanTime>({
    isHumanHours: false,
    statusMessage: 'Verificando horario...',
    scheduleMessage: ''
  });

  useEffect(() => {
    const checkTime = () => {
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
      
      if (isWithinHours) {
        setTimeInfo({
          isHumanHours: true,
          statusMessage: 'Estamos atendiendo',
          scheduleMessage: 'Lunes a Viernes de 8:30 a 17:30'
        });
      } else {
        setTimeInfo({
          isHumanHours: false,
          statusMessage: 'Fuera de horario de atención',
          scheduleMessage: 'Te responderemos cuando estemos disponibles'
        });
      }
    };

    checkTime();
    const intervalId = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  return timeInfo;
};
import { useState, useEffect } from 'react';

interface ChileanTime {
  isHumanHours: boolean;
  isLunchBreak: boolean;
  statusMessage: string;
  scheduleMessage: string;
  isLoading: boolean;
}

export const useChileanTime = (): ChileanTime => {
  const [timeInfo, setTimeInfo] = useState<Omit<ChileanTime, 'isLoading'>>({
    isHumanHours: false,
    isLunchBreak: false,
    statusMessage: '',
    scheduleMessage: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimeInfo = async () => {
      try {
        const response = await fetch('/api/time');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setTimeInfo(data);
      } catch (error) {
        console.error("Failed to fetch time info:", error);
        // Si no se puede verificar el horario, se asume FUERA de horario humano:
        // esa ruta siempre tiene respuesta, porque el asistente atiende 24/7.
        setTimeInfo({
          isHumanHours: false,
          isLunchBreak: false,
          statusMessage: 'No se pudo verificar el horario',
          scheduleMessage: 'Nuestro asistente te responde ahora'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeInfo();
    const intervalId = setInterval(fetchTimeInfo, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, []);

  return { ...timeInfo, isLoading };
};

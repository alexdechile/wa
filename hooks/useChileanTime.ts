import { useState, useEffect } from 'react';

interface ChileanTime {
  isHumanHours: boolean;
  statusMessage: string;
  scheduleMessage: string;
  isLoading: boolean;
}

export const useChileanTime = (): ChileanTime => {
  const [timeInfo, setTimeInfo] = useState<Omit<ChileanTime, 'isLoading'>>({
    isHumanHours: false,
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
        // Fallback for offline or API error
        setTimeInfo({
          isHumanHours: false,
          statusMessage: 'No se pudo verificar el horario',
          scheduleMessage: 'Inténtalo de nuevo más tarde'
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
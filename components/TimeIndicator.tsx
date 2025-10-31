import React from 'react';

interface TimeIndicatorProps {
  isHumanHours: boolean;
  line1: string;
  line2: string;
}

export const TimeIndicator: React.FC<TimeIndicatorProps> = ({ isHumanHours, line1, line2 }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-1 mt-4 text-base sm:text-lg text-gray-300">
      <div className="flex items-center space-x-2">
        <span className={`w-3 h-3 rounded-full ${isHumanHours ? 'bg-green-500' : 'bg-slate-400'}`}></span>
        <span>{line1}</span>
      </div>
      {line2 && (
        <span className="text-sm sm:text-base text-gray-400">{line2}</span>
      )}
    </div>
  );
};
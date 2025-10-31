import React from 'react';
import { TextSmallerIcon, TextBiggerIcon, QuestionMarkIcon } from './icons';

interface FontSizeControlProps {
  onIncrease: () => void;
  onDecrease: () => void;
  onShowTutorial: () => void;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({ onIncrease, onDecrease, onShowTutorial }) => {
  return (
    <div className="flex items-center space-x-1 bg-white/10 rounded-full p-1">
      <button
        onClick={onDecrease}
        aria-label="Disminuir tamaño de letra"
        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        style={{ minWidth: '48px', minHeight: '48px'}}
      >
        <TextSmallerIcon />
      </button>
      <button
        onClick={onIncrease}
        aria-label="Aumentar tamaño de letra"
        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        style={{ minWidth: '48px', minHeight: '48px'}}
      >
        <TextBiggerIcon />
      </button>
      <button
        onClick={onShowTutorial}
        aria-label="Mostrar ayuda para cambiar tamaño de letra"
        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        style={{ minWidth: '48px', minHeight: '48px'}}
      >
        <QuestionMarkIcon />
      </button>
    </div>
  );
};
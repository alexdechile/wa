import React from 'react';
import { HandSwipeIcon, TextBiggerIcon, TextSmallerIcon } from './icons';

interface SwipeTutorialProps {
  onClose: () => void;
}

export const SwipeTutorial: React.FC<SwipeTutorialProps> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div 
        className="bg-[#182260] border-2 border-white/20 rounded-2xl p-6 sm:p-8 text-center max-w-sm w-full flex flex-col items-center shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h3 id="tutorial-title" className="text-2xl font-bold mb-4 text-white">Gesto Rápido</h3>
        <p className="text-gray-300 mb-6">Usa un dedo para deslizar en diagonal por la pantalla y cambiar el tamaño del texto.</p>

        <div className="space-y-6 w-full">
            {/* Increase font size tutorial */}
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                <div className="text-left">
                    <p className="font-semibold">Agrandar Texto</p>
                    <p className="text-sm text-gray-400">Desliza arriba y a la derecha</p>
                </div>
                <div className="flex items-center space-x-2 text-amber-400">
                    <HandSwipeIcon />
                    <TextBiggerIcon />
                </div>
            </div>

            {/* Decrease font size tutorial */}
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                 <div className="text-left">
                    <p className="font-semibold">Achicar Texto</p>
                    <p className="text-sm text-gray-400">Desliza abajo y a la izquierda</p>
                </div>
                <div className="flex items-center space-x-2 text-sky-400">
                     <HandSwipeIcon />
                    <TextSmallerIcon />
                </div>
            </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 bg-amber-500 hover:bg-amber-600 text-[#182260] font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-amber-300"
          aria-label="Cerrar tutorial"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
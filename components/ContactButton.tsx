import React from 'react';

interface ContactButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
}

export const ContactButton: React.FC<ContactButtonProps> = ({ icon, text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        w-full max-w-md h-[70px] sm:h-[80px] 
        bg-amber-500 hover:bg-amber-600 
        text-[#182260] 
        font-bold text-xl sm:text-2xl 
        rounded-2xl 
        flex items-center justify-center 
        p-4 
        transition-transform transform hover:scale-105 
        focus:outline-none focus:ring-4 focus:ring-amber-300
        shadow-lg
      "
      style={{ minHeight: '60px', minWidth: '48px' }}
      aria-label={text}
    >
      <span className="mr-4 text-3xl">{icon}</span>
      <span>{text}</span>
    </button>
  );
};

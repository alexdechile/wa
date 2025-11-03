import React from 'react';

const LogoIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    stroke="white"
    fill="white"
    strokeWidth="5"
    strokeLinecap="round"
  >
    <g>
      {/* Dots */}
      <circle cx="50" cy="50" r="7"/>
      <circle cx="50" cy="10" r="7"/>
      <circle cx="84.6" cy="30" r="7"/>
      <circle cx="84.6" cy="70" r="7"/>
      <circle cx="50" cy="90" r="7"/>
      <circle cx="15.4" cy="70" r="7"/>
      <circle cx="15.4" cy="30" r="7"/>
      
      {/* Lines from center */}
      <line x1="50" y1="50" x2="50" y2="10"/>
      <line x1="50" y1="50" x2="84.6" y2="30"/>
      <line x1="50" y1="50" x2="84.6" y2="70"/>
      <line x1="50" y1="50" x2="50" y2="90"/>
      <line x1="50" y1="50" x2="15.4" y2="70"/>
      <line x1="50" y1="50" x2="15.4" y2="30"/>
      
      {/* Perimeter lines */}
      <line x1="50" y1="10" x2="84.6" y2="30"/>
      <line x1="84.6" y1="30" x2="84.6" y2="70"/>
      <line x1="84.6" y1="70" x2="50" y2="90"/>
      <line x1="50" y1="90" x2="15.4" y2="70"/>
      <line x1="15.4" y1="70" x2="15.4" y2="30"/>
      <line x1="15.4" y1="30" x2="50" y2="10"/>
    </g>
  </svg>
);

export const ComerzaLogo: React.FC = () => {
    return (
        <div className="flex items-center" aria-label="Comerza">
            <LogoIcon className="h-8 w-8 sm:h-9 sm:w-9 mr-3" />
            <h1 
                className="text-4xl sm:text-5xl"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em', lineHeight: '1' }}
            >
                COMERZA
            </h1>
        </div>
    );
};

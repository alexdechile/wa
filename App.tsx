import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChileanTime } from './hooks/useChileanTime';
import { useFontSize } from './hooks/useFontSize';
import { ContactButton } from './components/ContactButton';
import { FontSizeControl } from './components/FontSizeControl';
import { TimeIndicator } from './components/TimeIndicator';
import { SwipeTutorial } from './components/SwipeTutorial';
import { StoreIcon, ChatIcon, CartIcon, EmailIcon } from './components/icons';
import { ComerzaLogo } from './components/ComerzaLogo';
import type { TrackEntry } from './types';

const App: React.FC = () => {
  const { isHumanHours, statusMessage, scheduleMessage } = useChileanTime();
  const { increaseFontSize, decreaseFontSize } = useFontSize();
  const [contactsToday, setContactsToday] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState(false);

  // Refs for swipe gesture
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeHandled = useRef(false);
  const SWIPE_THRESHOLD = 50; // pixels

  useEffect(() => {
    const storedData = localStorage.getItem('comerzaContactCounter');
    const today = new Date().toISOString().split('T')[0];
    
    if (storedData) {
      try {
        const { date, count } = JSON.parse(storedData);
        if (date === today) {
          setContactsToday(count);
        } else {
          localStorage.setItem('comerzaContactCounter', JSON.stringify({ date: today, count: 0 }));
          setContactsToday(0);
        }
      } catch (error) {
         localStorage.setItem('comerzaContactCounter', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('comerzaContactCounter', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);
  
  const trackContact = useCallback((buttonType: 'store' | 'support' | 'sales' | 'email') => {
    // 1. Update public counter
    const newCount = contactsToday + 1;
    setContactsToday(newCount);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('comerzaContactCounter', JSON.stringify({ date: today, count: newCount }));

    // 2. Internal tracking
    const newEntry: TrackEntry = {
      timestamp: new Date().toISOString(),
      button: buttonType,
      isHumanHours,
    };

    const log = JSON.parse(localStorage.getItem('comerzaContactLog') || '[]') as TrackEntry[];
    log.push(newEntry);
    localStorage.setItem('comerzaContactLog', JSON.stringify(log));
  }, [contactsToday, isHumanHours]);

  const handleContactClick = (type: 'store' | 'support' | 'sales' | 'email', url: string) => {
    trackContact(type);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swipeHandled.current = false;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeHandled.current || e.touches.length === 0) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Swipe up-right to increase font size
    if (deltaX > SWIPE_THRESHOLD && deltaY < -SWIPE_THRESHOLD) {
      increaseFontSize();
      swipeHandled.current = true;
    }
    // Swipe down-left to decrease font size
    else if (deltaX < -SWIPE_THRESHOLD && deltaY > SWIPE_THRESHOLD) {
      decreaseFontSize();
      swipeHandled.current = true;
    }
  };

  const whatsappNumber = '+56226830645';
  const supportMessage = encodeURIComponent('Hola, necesito ayuda con...');
  const salesMessage = encodeURIComponent('Hola, quisiera cotizar...');

  return (
    <div 
      className="bg-[#182260] text-white min-h-screen flex flex-col font-sans p-4 sm:p-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {showTutorial && <SwipeTutorial onClose={() => setShowTutorial(false)} />}
      
      <header className="flex justify-between items-center w-full max-w-2xl mx-auto mb-8">
        <ComerzaLogo />
        <FontSizeControl 
          onIncrease={increaseFontSize} 
          onDecrease={decreaseFontSize} 
          onShowTutorial={() => setShowTutorial(true)}
        />
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
        <div className="text-center w-full">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4">¿En qué podemos ayudarte?</h2>
          <TimeIndicator
            isHumanHours={isHumanHours}
            line1={statusMessage}
            line2={scheduleMessage}
          />
          
          <div className="mt-10 flex flex-col items-center gap-y-5 w-full">
            <ContactButton
              icon={<StoreIcon />}
              text="Visitar Tienda Online"
              onClick={() => handleContactClick('store', 'https://www.comerza.cl')}
            />
            <ContactButton
              icon={<ChatIcon />}
              text="Consultas y Soporte"
              onClick={() => handleContactClick('support', `https://wa.me/${whatsappNumber}?text=${supportMessage}`)}
            />
            <ContactButton
              icon={<CartIcon />}
              text="Ventas y Cotizaciones"
              onClick={() => handleContactClick('sales', `https://wa.me/${whatsappNumber}?text=${salesMessage}`)}
            />
             <ContactButton
              icon={<EmailIcon />}
              text="Enviar un Email"
              onClick={() => handleContactClick('email', 'mailto:ventas@comerza.cl')}
            />
          </div>
        </div>
      </main>
      
      <footer className="w-full max-w-2xl mx-auto text-center py-4 mt-8">
        <p className="text-lg sm:text-xl font-medium bg-white/10 rounded-full px-4 py-2 inline-block">
          Contactos atendidos hoy: {contactsToday}
        </p>
      </footer>
    </div>
  );
};

export default App;
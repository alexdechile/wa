import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useChileanTime } from './hooks/useChileanTime';
import { useFontSize } from './hooks/useFontSize';
import { ContactButton } from './components/ContactButton';
import { FontSizeControl } from './components/FontSizeControl';
import { TimeIndicator } from './components/TimeIndicator';
import { SwipeTutorial } from './components/SwipeTutorial';
import { StoreIcon, ChatIcon, CartIcon, EmailIcon, MaterialsIcon } from './components/icons';
import { ComerzaLogo } from './components/ComerzaLogo';
import type { ContactButtonType, TargetLine, TrackEntry } from './types';

/**
 * Líneas de atención (ver openspec/proposals/comerza-door-experiment/spec.md):
 *
 * - HUMAN: atención de personas, lunes a viernes de 8:30 a 13:00 y de 14:00 a
 *   17:30.
 * - ASSISTANT: línea de wacli, el asistente que recibe requerimientos y
 *   responde 24/7. Nunca cotiza: recibe y deriva a un humano.
 *
 * En horario hábil se ofrecen ambas. Fuera de horario (noche, fin de semana y
 * almuerzo) todo el tráfico de conversación va al asistente.
 */
const HUMAN_WHATSAPP = '+56226830645';
const ASSISTANT_WHATSAPP = '+56226832189';
const STORE_URL = 'https://www.comerza.cl';
const SALES_EMAIL = 'ventas@comerza.cl';

const PREFILL_SUPPORT = encodeURIComponent('Hola, necesito ayuda con...');
const PREFILL_SALES = encodeURIComponent('Hola, quisiera cotizar...');
const PREFILL_MATERIALS = encodeURIComponent(
  'Hola, quiero cotizar una lista de materiales. Se la envío en foto, texto o Excel:'
);

const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${text}`;

const App: React.FC = () => {
  const { isHumanHours, isLunchBreak, statusMessage, scheduleMessage, isLoading } = useChileanTime();
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
  
  const trackContact = useCallback((buttonType: ContactButtonType, targetLine: TargetLine) => {
    // 1. Update public counter (UI feedback is instant)
    const newCount = contactsToday + 1;
    setContactsToday(newCount);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('comerzaContactCounter', JSON.stringify({ date: today, count: newCount }));

    // 2. Send data to serverless function for persistent logging
    const trackPayload: TrackEntry = {
      timestamp: new Date().toISOString(),
      button: buttonType,
      isHumanHours,
      isLunchBreak,
      targetLine,
    };

    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackPayload),
    }).catch(error => {
      // Log error but don't block user
      console.error('Failed to track contact:', error);
    });

  }, [contactsToday, isHumanHours, isLunchBreak]);

  const handleContactClick = (type: ContactButtonType, targetLine: TargetLine, url: string) => {
    trackContact(type, targetLine);
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

  // En horario hábil atiende una persona; fuera de horario (noche, fin de semana
  // y almuerzo) atiende el asistente.
  const conversationPhone = isHumanHours ? HUMAN_WHATSAPP : ASSISTANT_WHATSAPP;
  const conversationTarget: TargetLine = isHumanHours ? 'human' : 'assistant';

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
            line1={isLoading ? 'Verificando horario...' : statusMessage}
            line2={scheduleMessage}
          />
          
          <div className="mt-10 flex flex-col items-center gap-y-5 w-full">
            <ContactButton
              icon={<StoreIcon />}
              text="Visitar Tienda Online"
              onClick={() => handleContactClick('store', 'web', STORE_URL)}
            />
            <ContactButton
              icon={<ChatIcon />}
              text="Consultas y Soporte"
              onClick={() => handleContactClick('support', conversationTarget, waLink(conversationPhone, PREFILL_SUPPORT))}
            />
            <ContactButton
              icon={<CartIcon />}
              text="Ventas y Cotizaciones"
              onClick={() => handleContactClick('sales', conversationTarget, waLink(conversationPhone, PREFILL_SALES))}
            />
            <ContactButton
              icon={<MaterialsIcon />}
              text="Enviar Lista de Materiales"
              onClick={() => handleContactClick('materials', 'assistant', waLink(ASSISTANT_WHATSAPP, PREFILL_MATERIALS))}
            />
             <ContactButton
              icon={<EmailIcon />}
              text="Enviar un Email"
              onClick={() => handleContactClick('email', 'email', `mailto:${SALES_EMAIL}`)}
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

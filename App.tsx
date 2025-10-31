import React, { useState, useEffect, useCallback } from 'react';
import { useChileanTime } from './hooks/useChileanTime';
import { useFontSize } from './hooks/useFontSize';
import { ContactButton } from './components/ContactButton';
import { FontSizeControl } from './components/FontSizeControl';
import { TimeIndicator } from './components/TimeIndicator';
import { StoreIcon, ChatIcon, CartIcon, EmailIcon } from './components/icons';
import type { TrackEntry } from './types';

const App: React.FC = () => {
  const { isHumanHours, statusMessage, scheduleMessage } = useChileanTime();
  const { increaseFontSize, decreaseFontSize } = useFontSize();
  const [contactsToday, setContactsToday] = useState<number>(0);

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

    // SUGGESTION FOR GOOGLE SHEETS INTEGRATION:
    // To send this data to Google Sheets, create a Google Apps Script Web App.
    // The script would receive a POST request and append a new row to a sheet.
    /*
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Important for simple web apps
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEntry),
    }).catch(error => console.error('Error sending data to Google Sheets:', error));
    */
  }, [contactsToday, isHumanHours]);

  const handleContactClick = (type: 'store' | 'support' | 'sales' | 'email', url: string) => {
    trackContact(type);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const whatsappNumber = '+56226830645';
  const supportMessage = encodeURIComponent('Hola, necesito ayuda con...');
  const salesMessage = encodeURIComponent('Hola, quisiera cotizar...');

  return (
    <div className="bg-[#182260] text-white min-h-screen flex flex-col font-sans p-4 sm:p-6">
      <header className="flex justify-between items-center w-full max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Comerza</h1>
        <FontSizeControl onIncrease={increaseFontSize} onDecrease={decreaseFontSize} />
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
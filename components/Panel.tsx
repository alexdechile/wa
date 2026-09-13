import React, { useCallback, useEffect, useState } from 'react';
import { ComerzaLogo } from './ComerzaLogo';

interface PanelEvent {
  at: string;
  button: string;
  targetLine: string | null;
  country: string | null;
  outOfHours: boolean;
}

interface Summary {
  email: string;
  date: string;
  total: number;
  byButton: Record<string, number>;
  lunch: number;
  outOfHours: number;
  toHuman: number;
  toAssistant: number;
  bridge: { connected: boolean; authenticated: boolean } | null;
  latest: PanelEvent[];
}

type Step = 'loading' | 'email' | 'code' | 'ready';

const BUTTON_LABELS: Record<string, string> = {
  store: 'Tienda online',
  support: 'Consultas y soporte',
  sales: 'Ventas y cotizaciones',
  materials: 'Lista de materiales',
  email: 'Email',
};

const TIME_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const label = (button: string) => BUTTON_LABELS[button] ?? button;

export const Panel: React.FC = () => {
  const [step, setStep] = useState<Step>('loading');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/panel/summary');
      if (response.status === 401) {
        setStep('email');
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? 'No se pudo cargar el panel');
        setStep('email');
        return;
      }
      setSummary((await response.json()) as Summary);
      setStep('ready');
    } catch {
      setError('No se pudo conectar con el panel');
      setStep('email');
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message ?? 'No se pudo enviar el código');
        return;
      }
      setMessage(body.message ?? 'Revisa tu WhatsApp.');
      setStep('code');
    } catch {
      setError('No se pudo conectar');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.message ?? 'Código inválido o vencido');
        return;
      }
      setCode('');
      setMessage('');
      await loadSummary();
    } catch {
      setError('No se pudo conectar');
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setSummary(null);
    setStep('email');
    setMessage('');
  };

  const inputClass =
    'w-full rounded-xl px-4 py-4 text-xl text-[#182260] bg-white border-2 border-transparent focus:outline-none focus:ring-4 focus:ring-amber-300';
  const buttonClass =
    'w-full h-[64px] bg-amber-500 hover:bg-amber-600 text-[#182260] font-bold text-xl rounded-2xl transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-amber-300 disabled:opacity-60';

  return (
    <div className="bg-[#182260] text-white min-h-screen flex flex-col p-4 sm:p-6">
      <header className="flex justify-between items-center w-full max-w-3xl mx-auto mb-8">
        <ComerzaLogo />
        {step === 'ready' && (
          <button
            onClick={logout}
            className="text-base sm:text-lg bg-white/10 hover:bg-white/20 rounded-full px-5 py-2"
          >
            Salir
          </button>
        )}
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto">
        {step === 'loading' && (
          <p className="text-xl text-gray-300">Cargando panel...</p>
        )}

        {(step === 'email' || step === 'code') && (
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-semibold mb-2">Panel interno</h1>
            <p className="text-gray-300 mb-8">
              Acceso solo para personas autorizadas. Te enviamos un código por
              WhatsApp.
            </p>

            {step === 'email' ? (
              <form onSubmit={requestCode} className="space-y-4">
                <label className="block text-lg" htmlFor="email">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="nombre@comerza.cl"
                />
                <button type="submit" disabled={busy} className={buttonClass}>
                  {busy ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="space-y-4">
                <label className="block text-lg" htmlFor="code">
                  Código de 6 dígitos
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className={`${inputClass} tracking-[0.5em] text-center text-2xl`}
                  placeholder="000000"
                />
                <button type="submit" disabled={busy} className={buttonClass}>
                  {busy ? 'Verificando...' : 'Entrar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setCode('');
                    setMessage('');
                  }}
                  className="w-full text-gray-300 underline py-2"
                >
                  Usar otro correo
                </button>
              </form>
            )}

            {message && !error && (
              <p className="mt-6 text-amber-300 text-lg">{message}</p>
            )}
            {error && <p className="mt-6 text-red-300 text-lg">{error}</p>}
          </div>
        )}

        {step === 'ready' && summary && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-semibold">Contactos del día</h1>
              <p className="text-gray-300">
                {summary.date} · sesión de {summary.email}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Contactos" value={summary.total} />
              <Stat label="Fuera de horario" value={summary.outOfHours} />
              <Stat label="En almuerzo" value={summary.lunch} />
              <Stat
                label="Al asistente"
                value={summary.toAssistant}
              />
            </div>

            <StatusLine bridge={summary.bridge} />

            <section>
              <h2 className="text-xl font-semibold mb-3">Por tipo</h2>
              {Object.keys(summary.byButton).length === 0 ? (
                <p className="text-gray-400">Sin contactos registrados hoy.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.keys(summary.byButton)
                    .map((button): [string, number] => [button, summary.byButton[button]])
                    .sort((a, b) => b[1] - a[1])
                    .map(([button, count]) => (
                      <li
                        key={button}
                        className="flex justify-between bg-white/10 rounded-xl px-4 py-3 text-lg"
                      >
                        <span>{label(button)}</span>
                        <span className="font-semibold">{count}</span>
                      </li>
                    ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Últimos contactos</h2>
              {summary.latest.length === 0 ? (
                <p className="text-gray-400">Nada por acá todavía.</p>
              ) : (
                <ul className="space-y-2">
                  {summary.latest.map((event) => (
                    <li
                      key={`${event.at}-${event.button}`}
                      className="flex flex-wrap justify-between gap-2 bg-white/5 rounded-xl px-4 py-3"
                    >
                      <span className="text-lg">
                        {TIME_FORMATTER.format(new Date(event.at))} · {label(event.button)}
                      </span>
                      <span className="text-gray-400 text-base">
                        {event.targetLine === 'assistant' ? 'asistente' : event.targetLine ?? '—'}
                        {event.country ? ` · ${event.country}` : ''}
                        {event.outOfHours ? ' · fuera de horario' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <button onClick={() => void loadSummary()} className={buttonClass}>
              Actualizar
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white/10 rounded-2xl p-4 text-center">
    <div className="text-3xl font-semibold">{value}</div>
    <div className="text-gray-300 text-sm sm:text-base mt-1">{label}</div>
  </div>
);

const StatusLine: React.FC<{ bridge: Summary['bridge'] }> = ({ bridge }) => {
  if (!bridge) {
    return (
      <p className="text-amber-300 bg-amber-500/10 rounded-xl px-4 py-3">
        No se pudo consultar el estado del asistente: puede haber contactos sin
        registrar.
      </p>
    );
  }
  if (!bridge.connected) {
    return (
      <p className="text-red-300 bg-red-500/10 rounded-xl px-4 py-3">
        El asistente está desconectado: los mensajes no se están recibiendo.
      </p>
    );
  }
  return (
    <p className="text-green-300 bg-green-500/10 rounded-xl px-4 py-3">
      Asistente conectado y recibiendo mensajes.
    </p>
  );
};

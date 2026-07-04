'use client';

import { useEffect, useRef, useState } from 'react';

interface CronometroProps {
  /** segundos restantes no início */
  segundosIniciais: number;
  onEsgotar: () => void;
}

function formatar(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(seg).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function Cronometro({ segundosIniciais, onEsgotar }: CronometroProps) {
  const [restante, setRestante] = useState(segundosIniciais);
  const esgotouRef = useRef(false);

  useEffect(() => {
    const fim = Date.now() + segundosIniciais * 1000;
    const timer = setInterval(() => {
      const r = Math.max(0, Math.round((fim - Date.now()) / 1000));
      setRestante(r);
      if (r === 0 && !esgotouRef.current) {
        esgotouRef.current = true;
        clearInterval(timer);
        onEsgotar();
      }
    }, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundosIniciais]);

  const urgente = restante <= 60;

  return (
    <div
      className={`rounded-lg px-4 py-2 font-mono text-lg font-semibold tabular-nums ${
        urgente ? 'animate-pulse bg-erro/10 text-erro' : 'bg-salvia-100 text-salvia-700'
      }`}
      aria-live="polite"
    >
      ⏱ {formatar(restante)}
    </div>
  );
}

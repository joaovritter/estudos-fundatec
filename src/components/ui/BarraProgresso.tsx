'use client';

import { motion } from 'framer-motion';

interface BarraProgressoProps {
  /** 0–100, o quanto já foi confirmado/alvo atual */
  valor: number;
  /** duração da animação de largura em segundos (curta ao confirmar, longa no "creep") */
  duracao?: number;
}

// Barra determinada com brilho (shimmer) contínuo por cima: comunica ao mesmo
// tempo "quanto já andou" e "ainda está trabalhando", para nunca parecer travada.
export default function BarraProgresso({ valor, duracao = 0.5 }: BarraProgressoProps) {
  const pct = Math.min(100, Math.max(0, valor));
  return (
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-creme-200"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="relative h-full overflow-hidden rounded-full bg-salvia-600"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: duracao, ease: 'easeOut' }}
      >
        <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-creme-50/40 to-transparent" />
      </motion.div>
    </div>
  );
}

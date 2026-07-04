'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconeGirar } from '@/components/ui/Icones';

interface FlashcardProps {
  frente: string;
  verso: string;
  /** reseta a face quando o card muda */
  chave: string;
}

// Ficha de estudo que vira frente↔verso (rotação 3D, só transform/opacity)
export default function Flashcard({ frente, verso, chave }: FlashcardProps) {
  const [virado, setVirado] = useState(false);

  return (
    <div
      key={chave}
      className="mx-auto h-72 w-full max-w-xl cursor-pointer select-none"
      style={{ perspective: 1200 }}
      onClick={() => setVirado((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setVirado((v) => !v);
        }
      }}
      aria-label={virado ? 'Ver frente do card' : 'Ver verso do card'}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: virado ? 180 : 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0.35, 1] }}
      >
        {/* Frente: ficha pautada com furo de fichário */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl border border-terra-500/15 bg-creme-50 p-6 shadow-carta-alta"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-ambar-200/60 px-2.5 py-0.5 font-display text-xs font-semibold uppercase tracking-widest text-ambar-700">
              Pergunta
            </span>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-terra-500/25" aria-hidden="true" />
          </div>
          <div className="flex flex-1 items-center justify-center overflow-y-auto text-center">
            <p className="font-display text-xl leading-snug text-terra-900">{frente}</p>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-terra-400">
            <IconeGirar className="h-3.5 w-3.5" /> toque para virar
          </p>
        </div>

        {/* Verso */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl border border-salvia-500/30 bg-salvia-100 p-6 shadow-carta-alta"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-salvia-300/50 px-2.5 py-0.5 font-display text-xs font-semibold uppercase tracking-widest text-salvia-800">
              Resposta
            </span>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-salvia-500/40" aria-hidden="true" />
          </div>
          <div className="flex flex-1 items-center justify-center overflow-y-auto text-center">
            <p className="leading-relaxed text-terra-900">{verso}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FlashcardProps {
  frente: string;
  verso: string;
  /** reseta a face quando o card muda */
  chave: string;
}

// Card que vira frente↔verso com animação 3D (Framer Motion)
export default function Flashcard({ frente, verso, chave }: FlashcardProps) {
  const [virado, setVirado] = useState(false);

  return (
    <div
      key={chave}
      className="mx-auto h-64 w-full max-w-xl cursor-pointer select-none"
      style={{ perspective: 1200 }}
      onClick={() => setVirado((v) => !v)}
      role="button"
      aria-label={virado ? 'Ver frente do card' : 'Ver verso do card'}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: virado ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl border border-ambar-400/40 bg-creme-50 p-6 text-center shadow-md"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ambar-600">Frente</p>
            <p className="text-lg text-terra-900">{frente}</p>
            <p className="mt-4 text-xs text-terra-500">toque para virar</p>
          </div>
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center overflow-y-auto rounded-2xl border border-salvia-500/40 bg-salvia-100 p-6 text-center shadow-md"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-salvia-700">Verso</p>
            <p className="text-terra-900">{verso}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

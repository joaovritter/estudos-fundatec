'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo?: string;
  children: React.ReactNode;
  largura?: string;
}

export default function Modal({ aberto, onFechar, titulo, children, largura = 'max-w-lg' }: ModalProps) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-terra-900/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
        >
          <motion.div
            className={`w-full ${largura} max-h-[90vh] overflow-y-auto rounded-2xl bg-creme-50 p-6 shadow-xl`}
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {titulo && <h2 className="mb-4 font-display text-xl font-semibold text-terra-900">{titulo}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

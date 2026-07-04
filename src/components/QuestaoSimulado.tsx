'use client';

import { motion } from 'framer-motion';
import type { QuestaoDTO } from '@/types';

const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;

interface QuestaoSimuladoProps {
  questao: QuestaoDTO;
  respostaSelecionada?: string;
  onResponder?: (letra: string) => void;
  /** modo leitura: mostra gabarito, justificativa e resposta do usuário */
  leitura?: boolean;
}

export default function QuestaoSimulado({
  questao,
  respostaSelecionada,
  onResponder,
  leitura = false,
}: QuestaoSimuladoProps) {
  return (
    <motion.div
      className="cartao"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <p className="mb-4 font-medium text-terra-900">
        <span className="mr-2 inline-block rounded bg-terra-500/10 px-2 py-0.5 text-sm font-semibold text-terra-700">
          {questao.ordem}
        </span>
        {questao.enunciado}
      </p>

      <div className="space-y-2">
        {LETRAS.map((letra) => {
          const texto = questao.alternativas[letra];
          const selecionada = leitura ? questao.respostaUsuario === letra : respostaSelecionada === letra;
          const ehGabarito = leitura && questao.gabarito === letra;
          const erradaMarcada = leitura && selecionada && !ehGabarito;

          let estilo = 'border-terra-500/20 bg-creme-50 hover:bg-creme-200';
          if (!leitura && selecionada) estilo = 'border-salvia-600 bg-salvia-100 ring-1 ring-salvia-500';
          if (ehGabarito) estilo = 'border-acerto bg-salvia-100 ring-1 ring-acerto';
          if (erradaMarcada) estilo = 'border-erro bg-erro/10 ring-1 ring-erro';

          return (
            <button
              key={letra}
              type="button"
              disabled={leitura}
              onClick={() => onResponder?.(letra)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${estilo} ${leitura ? 'cursor-default' : ''}`}
            >
              <span className="mt-0.5 font-semibold text-terra-700">{letra})</span>
              <span className="text-terra-900">{texto}</span>
              {ehGabarito && <span className="ml-auto shrink-0 text-acerto">✓</span>}
              {erradaMarcada && <span className="ml-auto shrink-0 text-erro">✗</span>}
            </button>
          );
        })}
      </div>

      {leitura && (
        <div className="mt-4 space-y-2">
          {questao.respostaUsuario == null && (
            <p className="text-sm italic text-terra-500">Você deixou esta questão em branco.</p>
          )}
          {questao.justificativa && (
            <div className="rounded-lg bg-ambar-400/10 p-3 text-sm text-terra-800">
              <span className="font-semibold text-ambar-700">Justificativa: </span>
              {questao.justificativa}
            </div>
          )}
          {questao.feedbackIA && (
            <div className="rounded-lg bg-salvia-100 p-3 text-sm text-terra-800">
              <span className="font-semibold text-salvia-700">Professor IA: </span>
              {questao.feedbackIA}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

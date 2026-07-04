'use client';

import { motion } from 'framer-motion';
import { IconeCheck, IconeX } from '@/components/ui/Icones';
import type { QuestaoDTO } from '@/types';

const LETRAS = ['A', 'B', 'C', 'D', 'E'] as const;

interface QuestaoSimuladoProps {
  questao: QuestaoDTO;
  respostaSelecionada?: string;
  onResponder?: (letra: string) => void;
  /** modo leitura: mostra gabarito, justificativa e resposta do usuário */
  leitura?: boolean;
}

// Alternativas no estilo cartão-resposta: bolha circular com a letra,
// preenchida ao marcar — o elemento-assinatura do design.
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
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 shrink-0 font-display text-lg font-bold text-ambar-600">
          {String(questao.ordem).padStart(2, '0')}
        </span>
        <p className="font-medium leading-relaxed text-terra-900">{questao.enunciado}</p>
      </div>

      <div className="space-y-2" role={leitura ? undefined : 'radiogroup'} aria-label={`Alternativas da questão ${questao.ordem}`}>
        {LETRAS.map((letra) => {
          const texto = questao.alternativas[letra];
          const selecionada = leitura ? questao.respostaUsuario === letra : respostaSelecionada === letra;
          const ehGabarito = leitura && questao.gabarito === letra;
          const erradaMarcada = leitura && selecionada && !ehGabarito;

          let borda = 'border-terra-500/15 bg-creme-50 hover:border-salvia-500/50 hover:bg-salvia-100/40';
          let bolha = 'bolha';
          if (!leitura && selecionada) {
            borda = 'border-salvia-700 bg-salvia-100/60';
            bolha = 'bolha bolha-marcada';
          }
          if (ehGabarito) {
            borda = 'border-acerto bg-salvia-100/60';
            bolha = 'bolha bolha-certa';
          }
          if (erradaMarcada) {
            borda = 'border-erro bg-erro/5';
            bolha = 'bolha bolha-errada';
          }

          return (
            <button
              key={letra}
              type="button"
              role={leitura ? undefined : 'radio'}
              aria-checked={leitura ? undefined : selecionada}
              disabled={leitura}
              onClick={() => onResponder?.(letra)}
              className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-all duration-150 ${borda} ${
                leitura ? 'cursor-default' : 'cursor-pointer active:scale-[0.995]'
              }`}
            >
              <span className={bolha}>{letra}</span>
              <span className="leading-snug text-terra-900">{texto}</span>
              {ehGabarito && <IconeCheck className="ml-auto h-5 w-5 shrink-0 text-acerto" />}
              {erradaMarcada && <IconeX className="ml-auto h-5 w-5 shrink-0 text-erro" />}
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
            <div className="rounded-xl border-l-4 border-ambar-400 bg-ambar-200/30 p-3 text-sm leading-relaxed text-terra-800">
              <span className="font-semibold text-ambar-700">Justificativa: </span>
              {questao.justificativa}
            </div>
          )}
          {questao.feedbackIA && (
            <div className="rounded-xl border-l-4 border-salvia-500 bg-salvia-100/60 p-3 text-sm leading-relaxed text-terra-800">
              <span className="font-semibold text-salvia-700">Professor IA: </span>
              {questao.feedbackIA}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

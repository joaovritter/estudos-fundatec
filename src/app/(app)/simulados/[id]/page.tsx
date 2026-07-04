'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Cronometro from '@/components/Cronometro';
import QuestaoSimulado from '@/components/QuestaoSimulado';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import { IconeSetaEsquerda, IconeMedalha } from '@/components/ui/Icones';
import { INFO_NIVEL } from '@/lib/dificuldade';
import type { SimuladoDTO } from '@/types';

function mensagemResultado(nota: number): string {
  if (nota >= 9) return 'Excelente! Você está prontíssimo(a) para a prova!';
  if (nota >= 7) return 'Muito bom! Continue nesse ritmo que a aprovação vem!';
  if (nota >= 5) return 'Bom começo! Revise os erros e refaça — é assim que se aprende!';
  return 'Não desanime! Cada erro agora é um acerto na prova. Revise e tente de novo!';
}

export default function SimuladoPage() {
  const { id } = useParams<{ id: string }>();
  const [simulado, setSimulado] = useState<SimuladoDTO | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [confirmFinalizar, setConfirmFinalizar] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [avaliando, setAvaliando] = useState(false);
  const finalizouRef = useRef(false);

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/simulados/${id}`);
    if (res.ok) {
      const { simulado } = await res.json();
      setSimulado(simulado);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const finalizar = useCallback(
    async (auto = false) => {
      if (finalizouRef.current) return;
      finalizouRef.current = true;
      setFinalizando(true);
      setConfirmFinalizar(false);
      await fetch(`/api/simulados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas }),
      });
      await carregar();
      setFinalizando(false);
      if (auto) alert('⏰ Tempo esgotado! Suas respostas foram enviadas.');
    },
    [id, respostas, carregar]
  );

  async function pedirAvaliacaoIA() {
    setAvaliando(true);
    await fetch(`/api/simulados/${id}/avaliar`, { method: 'POST' });
    await carregar();
    setAvaliando(false);
  }

  if (!simulado) return <Spinner texto="Carregando simulado…" />;

  const finalizado = simulado.status === 'finalizado';
  const respondidas = Object.keys(respostas).length;

  // tempo restante calculado a partir do início salvo no servidor
  const decorrido = Math.floor((Date.now() - new Date(simulado.iniciadoEm).getTime()) / 1000);
  const restante = Math.max(0, simulado.tempoLimite - decorrido);

  return (
    <div className="pb-24">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={finalizado ? '/simulados/historico' : '/simulados'}
          className="flex min-h-[44px] items-center gap-1 text-sm font-medium text-salvia-600 hover:underline"
        >
          <IconeSetaEsquerda className="h-4 w-4" /> {finalizado ? 'Histórico' : 'Simulados'}
        </Link>
        <h1 className="font-display text-2xl font-bold text-terra-900">{simulado.titulo}</h1>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${INFO_NIVEL[simulado.dificuldade]?.badge ?? INFO_NIVEL.medio.badge}`}
        >
          {INFO_NIVEL[simulado.dificuldade]?.rotulo ?? 'Médio'}
        </span>
      </div>

      {finalizado ? (
        <motion.div
          className="cartao mb-6 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="font-display text-sm uppercase tracking-widest text-terra-500">Sua nota</p>
          <p
            className={`my-1 font-display text-6xl font-bold tabular-nums ${
              (simulado.nota ?? 0) >= 5 ? 'text-acerto' : 'text-erro'
            }`}
          >
            {simulado.nota?.toFixed(1)}
          </p>
          <p className="mb-2 tabular-nums text-terra-700">
            {simulado.acertos} de {simulado.total} questões corretas
          </p>
          <p className="text-sm text-terra-500">
            <span className="grifo">{mensagemResultado(simulado.nota ?? 0)}</span>
          </p>
          {!simulado.questoes.every((q) => q.feedbackIA) && (
            <button className="btn-secundario mt-4 text-sm" onClick={pedirAvaliacaoIA} disabled={avaliando}>
              <IconeMedalha className="h-[18px] w-[18px] text-ambar-600" />
              {avaliando ? 'O professor IA está corrigindo…' : 'Pedir avaliação detalhada da IA'}
            </button>
          )}
        </motion.div>
      ) : (
        <div className="sticky top-16 z-30 mb-6 flex items-center justify-between gap-2 rounded-2xl border border-terra-500/15 bg-creme-50/95 p-3 shadow-carta backdrop-blur">
          <Cronometro segundosIniciais={restante} onEsgotar={() => finalizar(true)} />
          <span className="text-sm tabular-nums text-terra-700">
            {respondidas}/{simulado.questoes.length} respondidas
          </span>
          <button className="btn-primario" onClick={() => setConfirmFinalizar(true)} disabled={finalizando}>
            {finalizando ? 'Corrigindo…' : 'Finalizar'}
          </button>
        </div>
      )}

      <div className="space-y-5">
        {simulado.questoes.map((q) => (
          <QuestaoSimulado
            key={q.id}
            questao={q}
            leitura={finalizado}
            respostaSelecionada={respostas[q.id]}
            onResponder={(letra) => setRespostas((prev) => ({ ...prev, [q.id]: letra }))}
          />
        ))}
      </div>

      <ConfirmDialog
        aberto={confirmFinalizar}
        titulo="Finalizar simulado?"
        mensagem={
          respondidas < simulado.questoes.length
            ? `Você respondeu ${respondidas} de ${simulado.questoes.length} questões. As não respondidas contarão como erro.`
            : 'Todas as questões respondidas. Enviar para correção?'
        }
        textoConfirmar="Finalizar e corrigir"
        carregando={finalizando}
        onConfirmar={() => finalizar(false)}
        onCancelar={() => setConfirmFinalizar(false)}
      />
    </div>
  );
}

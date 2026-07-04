'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Spinner from '@/components/ui/Spinner';
import { IconeHistorico, IconeSetaDireita } from '@/components/ui/Icones';

interface SimuladoFinalizado {
  id: string;
  titulo: string;
  conteudoTitulo: string;
  qtdQuestoes: number;
  nota: number | null;
  acertos: number | null;
  total: number | null;
  finalizadoEm: string | null;
}

export default function HistoricoPage() {
  const [simulados, setSimulados] = useState<SimuladoFinalizado[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/simulados?status=finalizado')
      .then((r) => (r.ok ? r.json() : { simulados: [] }))
      .then((data) => setSimulados(data.simulados))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold text-terra-900">
        Histórico de <span className="grifo">Simulados</span>
      </h1>

      {carregando ? (
        <Spinner texto="Carregando histórico…" />
      ) : simulados.length === 0 ? (
        <div className="cartao flex flex-col items-center py-10 text-center text-terra-500">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-salvia-100 text-salvia-600">
            <IconeHistorico className="h-7 w-7" />
          </span>
          <p>
            Nenhum simulado finalizado ainda.{' '}
            <Link href="/simulados" className="text-salvia-600 hover:underline">
              Crie o primeiro!
            </Link>
          </p>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          initial="oculto"
          animate="visivel"
          variants={{ visivel: { transition: { staggerChildren: 0.06 } } }}
        >
          {simulados.map((s) => (
            <motion.div
              key={s.id}
              variants={{ oculto: { opacity: 0, y: 12 }, visivel: { opacity: 1, y: 0 } }}
            >
              <Link href={`/simulados/${s.id}`} className="cartao flex flex-wrap items-center gap-4 transition-shadow hover:shadow-md">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold tabular-nums text-creme-50 ${
                    (s.nota ?? 0) >= 5 ? 'bg-acerto' : 'bg-erro'
                  }`}
                >
                  {s.nota?.toFixed(1)}
                </div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-terra-900">{s.titulo}</p>
                  <p className="text-sm tabular-nums text-terra-500">
                    {s.acertos}/{s.total} acertos ·{' '}
                    {s.finalizadoEm && new Date(s.finalizadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-salvia-600">
                  Ver em modo leitura <IconeSetaDireita className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

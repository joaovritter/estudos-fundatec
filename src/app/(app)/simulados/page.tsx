'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import BarraProgresso from '@/components/ui/BarraProgresso';
import { IconeMais, IconeProva, IconeSetaDireita, IconeBrilho } from '@/components/ui/Icones';
import { NIVEIS, INFO_NIVEL, type Nivel } from '@/lib/dificuldade';
import type { ConteudoResumo } from '@/types';

interface SimuladoResumo {
  id: string;
  titulo: string;
  conteudoTitulo: string;
  qtdQuestoes: number;
  tempoLimite: number;
  dificuldade: Nivel;
  status: string;
  iniciadoEm: string;
}

const MIN_POR_QUESTAO = 3; // sugestão automática de tempo

export default function SimuladosPage() {
  const router = useRouter();
  const [simulados, setSimulados] = useState<SimuladoResumo[]>([]);
  const [conteudos, setConteudos] = useState<ConteudoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  // wizard de criação
  const [aberto, setAberto] = useState(false);
  const [conteudoId, setConteudoId] = useState('');
  const [assuntosSel, setAssuntosSel] = useState<Set<string>>(new Set());
  const [qtd, setQtd] = useState(10);
  const [nivel, setNivel] = useState<Nivel>('medio');
  const [tempoMin, setTempoMin] = useState(30);
  const [tempoEditado, setTempoEditado] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [progSim, setProgSim] = useState(0);
  const [progSimDur, setProgSimDur] = useState(0.5);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    const [rSim, rCon] = await Promise.all([
      fetch('/api/simulados?status=em_andamento'),
      fetch('/api/conteudos'),
    ]);
    if (rSim.ok) setSimulados((await rSim.json()).simulados);
    if (rCon.ok) setConteudos((await rCon.json()).conteudos);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // tempo sugerido acompanha a quantidade, até o usuário editar manualmente
  useEffect(() => {
    if (!tempoEditado) setTempoMin(qtd * MIN_POR_QUESTAO);
  }, [qtd, tempoEditado]);

  const conteudoAtual = conteudos.find((c) => c.id === conteudoId);

  function abrirWizard() {
    setConteudoId('');
    setAssuntosSel(new Set());
    setQtd(10);
    setNivel('medio');
    setTempoMin(10 * MIN_POR_QUESTAO);
    setTempoEditado(false);
    setErro('');
    setAberto(true);
  }

  async function criar() {
    if (!conteudoId || assuntosSel.size === 0) {
      setErro('Escolha um conteúdo e pelo menos um assunto.');
      return;
    }
    setErro('');
    setGerando(true);
    // Barra otimista: a geração é uma única chamada (o servidor gera em lotes),
    // então o frontend não tem marcos — a barra sobe devagar até ~92% enquanto
    // espera e completa quando a resposta chega. Tempo estimado ~4s/questão.
    setProgSim(0);
    setProgSimDur(0.4);
    requestAnimationFrame(() => {
      setProgSimDur(Math.max(20, qtd * 4));
      setProgSim(92);
    });
    const res = await fetch('/api/simulados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudoId,
        assuntos: Array.from(assuntosSel),
        qtdQuestoes: qtd,
        tempoLimite: tempoMin * 60,
        dificuldade: nivel,
      }),
    });
    if (!res.ok) {
      setGerando(false);
      const data = await res.json().catch(() => ({}));
      setErro(data.error || 'Falha ao gerar o simulado.');
      return;
    }
    setProgSimDur(0.4);
    setProgSim(100);
    const { simulado } = await res.json();
    router.push(`/simulados/${simulado.id}`);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-terra-900">
          <span className="grifo">Simulados</span>
        </h1>
        <button className="btn-primario" onClick={abrirWizard}>
          <IconeMais className="h-5 w-5" />
          <span className="hidden sm:inline">Novo simulado</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {carregando ? (
        <Spinner texto="Carregando…" />
      ) : simulados.length === 0 ? (
        <div className="cartao flex flex-col items-center py-10 text-center text-terra-500">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-salvia-100 text-salvia-600">
            <IconeProva className="h-7 w-7" />
          </span>
          <p>
            Nenhum simulado em andamento. Crie um novo ou veja o{' '}
            <Link href="/simulados/historico" className="text-salvia-600 hover:underline">
              histórico
            </Link>
            .
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
              className="cartao flex flex-wrap items-center gap-3"
              variants={{ oculto: { opacity: 0, y: 12 }, visivel: { opacity: 1, y: 0 } }}
            >
              <div className="flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <p className="font-display font-semibold text-terra-900">{s.titulo}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${INFO_NIVEL[s.dificuldade]?.badge ?? INFO_NIVEL.medio.badge}`}
                  >
                    {INFO_NIVEL[s.dificuldade]?.rotulo ?? 'Médio'}
                  </span>
                </div>
                <p className="text-sm tabular-nums text-terra-500">
                  {s.qtdQuestoes} questões · {Math.round(s.tempoLimite / 60)} min
                </p>
              </div>
              <Link href={`/simulados/${s.id}`} className="btn-primario">
                Continuar <IconeSetaDireita className="h-[18px] w-[18px]" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal aberto={aberto} onFechar={() => !gerando && setAberto(false)} titulo="Novo simulado" largura="max-w-xl">
        {gerando ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-terra-800">Montando seu simulado estilo FUNDATEC</span>
              <span className="font-mono tabular-nums text-terra-500">{Math.round(progSim)}%</span>
            </div>
            <BarraProgresso valor={progSim} duracao={progSimDur} />
            <p className="text-xs text-terra-400">
              A IA está elaborando {qtd} {qtd === 1 ? 'questão' : 'questões'} com alternativas no
              estilo da banca. Isso costuma levar de alguns segundos a um minuto.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-terra-700">Conteúdo</label>
              <select
                className="campo"
                value={conteudoId}
                onChange={(e) => {
                  setConteudoId(e.target.value);
                  setAssuntosSel(new Set());
                }}
              >
                <option value="">Selecione…</option>
                {conteudos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </select>
            </div>

            {conteudoAtual && (
              <div>
                <label className="mb-1 block text-sm font-medium text-terra-700">Assuntos do simulado</label>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg bg-creme-200 p-2">
                  {conteudoAtual.assuntos.map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-creme-300">
                      <input
                        type="checkbox"
                        checked={assuntosSel.has(a.nome)}
                        onChange={() =>
                          setAssuntosSel((prev) => {
                            const novo = new Set(prev);
                            if (novo.has(a.nome)) novo.delete(a.nome);
                            else novo.add(a.nome);
                            return novo;
                          })
                        }
                      />
                      {a.nome}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-terra-700">Nível de dificuldade</label>
              <div className="grid grid-cols-3 gap-2">
                {NIVEIS.map((n) => {
                  const info = INFO_NIVEL[n];
                  const ativo = nivel === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNivel(n)}
                      aria-pressed={ativo}
                      className={`rounded-xl border-2 p-2.5 text-center transition-all duration-150 active:scale-[0.98] ${
                        ativo
                          ? 'border-salvia-600 bg-salvia-100/60 ring-1 ring-salvia-500'
                          : 'border-terra-500/15 bg-creme-50 hover:border-salvia-500/40 hover:bg-salvia-100/30'
                      }`}
                    >
                      <span className="block font-display font-semibold text-terra-900">{info.rotulo}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-terra-500">{INFO_NIVEL[nivel].descricao}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-terra-700">Questões (1–30)</label>
                <input
                  type="number"
                  className="campo"
                  min={1}
                  max={30}
                  value={qtd}
                  onChange={(e) => setQtd(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-terra-700">
                  Tempo (min) <span className="text-xs text-terra-500">— sugerido: {qtd * MIN_POR_QUESTAO}</span>
                </label>
                <input
                  type="number"
                  className="campo"
                  min={1}
                  value={tempoMin}
                  onChange={(e) => {
                    setTempoEditado(true);
                    setTempoMin(Math.max(1, Number(e.target.value) || 1));
                  }}
                />
              </div>
            </div>

            {erro && <p className="text-sm text-erro">{erro}</p>}
            <button className="btn-primario w-full" onClick={criar}>
              <IconeBrilho className="h-[18px] w-[18px]" /> Gerar simulado
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Spinner from '@/components/ui/Spinner';
import {
  IconeSetaEsquerda,
  IconeConversa,
  IconeOlho,
  IconeGirar,
} from '@/components/ui/Icones';
import type { BlocoDTO } from '@/types';

interface AssuntoInfo {
  id: string;
  nome: string;
  _count: { blocosQA: number };
}

export default function QAPage() {
  const { id } = useParams<{ id: string }>();
  const [titulo, setTitulo] = useState('');
  const [assuntos, setAssuntos] = useState<AssuntoInfo[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [blocos, setBlocos] = useState<BlocoDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [estudando, setEstudando] = useState(false);
  const [carregandoBlocos, setCarregandoBlocos] = useState(false);

  // estado por bloco: índice da variação atual e se a resposta está revelada
  const [varAtual, setVarAtual] = useState<Record<string, number>>({});
  const [reveladas, setReveladas] = useState<Set<string>>(new Set());
  const [reformulando, setReformulando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/conteudos/${id}`);
    if (res.ok) {
      const { conteudo } = await res.json();
      setTitulo(conteudo.titulo);
      setAssuntos(conteudo.assuntos);
    }
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function alternarAssunto(assuntoId: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(assuntoId)) novo.delete(assuntoId);
      else novo.add(assuntoId);
      return novo;
    });
  }

  // Lê do banco as variações dos assuntos escolhidos — sem chamar a IA.
  async function iniciarEstudo() {
    setCarregandoBlocos(true);
    const resultados = await Promise.all(
      Array.from(selecionados).map((aid) => fetch(`/api/qa/${aid}`).then((r) => (r.ok ? r.json() : null)))
    );
    const todos: BlocoDTO[] = resultados.filter(Boolean).flatMap((r) => r.blocos);
    setBlocos(todos);
    setVarAtual({});
    setReveladas(new Set());
    setEstudando(true);
    setCarregandoBlocos(false);
  }

  // Reformular: avança para a próxima variação salva; se esgotou, chama a IA
  // para gerar +1 e salva no banco.
  async function reformular(bloco: BlocoDTO) {
    const atual = varAtual[bloco.id] ?? 0;
    if (atual + 1 < bloco.variacoes.length) {
      setVarAtual((prev) => ({ ...prev, [bloco.id]: atual + 1 }));
      setReveladas((prev) => {
        const novo = new Set(prev);
        novo.delete(bloco.id);
        return novo;
      });
      return;
    }
    // esgotou as variações do banco → gerar nova via IA
    setReformulando(bloco.id);
    const res = await fetch('/api/ia/reformular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'qa', blocoId: bloco.id }),
    });
    setReformulando(null);
    if (res.ok) {
      const { variacao } = await res.json();
      setBlocos((prev) =>
        prev.map((b) => (b.id === bloco.id ? { ...b, variacoes: [...b.variacoes, variacao] } : b))
      );
      setVarAtual((prev) => ({ ...prev, [bloco.id]: atual + 1 }));
      setReveladas((prev) => {
        const novo = new Set(prev);
        novo.delete(bloco.id);
        return novo;
      });
    }
  }

  if (carregando) return <Spinner texto="Carregando…" />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href="/conteudos"
          className="flex min-h-[44px] items-center gap-1 text-sm font-medium text-salvia-600 hover:underline"
        >
          <IconeSetaEsquerda className="h-4 w-4" /> Conteúdos
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-terra-900">
          <IconeConversa className="h-6 w-6 text-ambar-600" /> {titulo}
        </h1>
      </div>

      {!estudando ? (
        <div className="cartao mx-auto max-w-xl">
          <h2 className="mb-3 font-display text-lg font-semibold text-terra-900">
            Quais assuntos você quer <span className="grifo">estudar</span>?
          </h2>
          {assuntos.filter((a) => a._count.blocosQA > 0).length === 0 ? (
            <p className="text-terra-500">Este conteúdo ainda não tem perguntas geradas.</p>
          ) : (
            <>
              <div className="mb-4 space-y-2">
                {assuntos
                  .filter((a) => a._count.blocosQA > 0)
                  .map((a) => (
                    <label
                      key={a.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg bg-creme-200 p-3 transition-colors hover:bg-creme-300"
                    >
                      <input
                        type="checkbox"
                        checked={selecionados.has(a.id)}
                        onChange={() => alternarAssunto(a.id)}
                      />
                      <span className="flex-1 text-terra-900">{a.nome}</span>
                      <span className="text-xs text-terra-500">{a._count.blocosQA} blocos</span>
                    </label>
                  ))}
              </div>
              <button
                className="btn-primario w-full"
                onClick={iniciarEstudo}
                disabled={selecionados.size === 0 || carregandoBlocos}
              >
                {carregandoBlocos ? 'Carregando…' : `Estudar ${selecionados.size} assunto(s) →`}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            className="flex min-h-[44px] items-center gap-1 text-sm font-medium text-salvia-600 hover:underline"
            onClick={() => setEstudando(false)}
          >
            <IconeSetaEsquerda className="h-4 w-4" /> Trocar assuntos
          </button>

          <motion.div
            className="space-y-4"
            initial="oculto"
            animate="visivel"
            variants={{ visivel: { transition: { staggerChildren: 0.05 } } }}
          >
            {blocos.map((bloco) => {
              const iVar = Math.min(varAtual[bloco.id] ?? 0, bloco.variacoes.length - 1);
              const variacao = bloco.variacoes[iVar];
              if (!variacao) return null;
              const revelada = reveladas.has(bloco.id);

              return (
                <motion.div
                  key={bloco.id}
                  className="cartao"
                  variants={{ oculto: { opacity: 0, y: 12 }, visivel: { opacity: 1, y: 0 } }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-terra-500">
                    <span className="rounded-full bg-creme-200 px-2.5 py-1 font-medium">
                      {bloco.assuntoNome} · Bloco {bloco.idBloco}
                    </span>
                    <span className="font-mono tabular-nums">
                      variação {iVar + 1}/{bloco.variacoes.length}
                    </span>
                  </div>
                  <p className="mb-3 font-medium leading-relaxed text-terra-900">{variacao.pergunta}</p>

                  <AnimatePresence mode="wait">
                    {revelada && (
                      <motion.div
                        key={variacao.id}
                        className="mb-3 rounded-xl border-l-4 border-salvia-500 bg-salvia-100/70 p-3 leading-relaxed text-terra-800"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {variacao.resposta}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <button
                      className="btn-secundario flex-1 text-sm"
                      onClick={() =>
                        setReveladas((prev) => {
                          const novo = new Set(prev);
                          if (novo.has(bloco.id)) novo.delete(bloco.id);
                          else novo.add(bloco.id);
                          return novo;
                        })
                      }
                    >
                      <IconeOlho className="h-[18px] w-[18px] text-salvia-600" />
                      {revelada ? 'Ocultar resposta' : 'Revelar resposta'}
                    </button>
                    <button
                      className="btn-secundario flex-1 text-sm"
                      onClick={() => reformular(bloco)}
                      disabled={reformulando === bloco.id}
                      title="Mostra outra variação; se esgotaram, a IA gera uma nova"
                    >
                      <IconeGirar className="h-[18px] w-[18px] text-ambar-600" />
                      {reformulando === bloco.id ? 'Gerando nova…' : 'Reformular'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}

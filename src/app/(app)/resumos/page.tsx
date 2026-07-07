'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Spinner from '@/components/ui/Spinner';
import BarraProgresso from '@/components/ui/BarraProgresso';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  IconeResumo,
  IconeBrilho,
  IconeEditar,
  IconeLixeira,
  IconeGirar,
  IconeCheck,
  IconeSetaDireita,
} from '@/components/ui/Icones';
import type { ResumoDTO } from '@/types';

interface ItemConteudo {
  id: string;
  titulo: string;
  numPaginas: number | null;
  resumo: ResumoDTO | null;
}

export default function ResumosPage() {
  const [itens, setItens] = useState<ItemConteudo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<string | null>(null); // conteudoId expandido
  const [gerando, setGerando] = useState<string | null>(null);
  const [prog, setProg] = useState(0);
  const [progDur, setProgDur] = useState(0.5);
  const [erro, setErro] = useState('');

  // edição / deleção
  const [editando, setEditando] = useState<ResumoDTO | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editIntro, setEditIntro] = useState('');
  const [editChaves, setEditChaves] = useState('');
  const [deletando, setDeletando] = useState<ResumoDTO | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const res = await fetch('/api/resumos');
    if (res.ok) setItens((await res.json()).conteudos);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function gerar(conteudoId: string) {
    setErro('');
    setGerando(conteudoId);
    setProg(0);
    setProgDur(0.4);
    requestAnimationFrame(() => {
      setProgDur(35);
      setProg(92);
    });
    try {
      const res = await fetch('/api/ia/gerar-resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudoId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Falha ao gerar o resumo');
      }
      setProgDur(0.4);
      setProg(100);
      await carregar();
      setAberto(conteudoId);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar resumo');
    } finally {
      setGerando(null);
    }
  }

  function abrirEdicao(r: ResumoDTO) {
    setEditando(r);
    setEditTitulo(r.titulo);
    setEditIntro(r.introducao);
    setEditChaves(r.palavrasChave.join(', '));
  }

  async function salvarEdicao() {
    if (!editando) return;
    setOcupado(true);
    await fetch(`/api/resumos/${editando.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: editTitulo,
        introducao: editIntro,
        palavrasChave: editChaves
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    setOcupado(false);
    setEditando(null);
    carregar();
  }

  async function confirmarDelecao() {
    if (!deletando) return;
    setOcupado(true);
    await fetch(`/api/resumos/${deletando.id}`, { method: 'DELETE' });
    setOcupado(false);
    setDeletando(null);
    carregar();
  }

  if (carregando) return <Spinner texto="Carregando resumos…" />;

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold text-terra-900">
        <span className="grifo">Resumos</span>
      </h1>

      {erro && <p className="mb-4 text-sm text-erro">{erro}</p>}

      {itens.length === 0 ? (
        <div className="cartao flex flex-col items-center py-10 text-center text-terra-500">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-salvia-100 text-salvia-600">
            <IconeResumo className="h-7 w-7" />
          </span>
          <p>Nenhum conteúdo ainda. Adicione um PDF em Conteúdos para gerar resumos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map((c) => {
            const estaAberto = aberto === c.id;
            const gerandoEste = gerando === c.id;
            return (
              <div key={c.id} className="cartao">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <p className="font-display font-semibold text-terra-900">{c.titulo}</p>
                    <p className="text-xs text-terra-500">
                      {c.numPaginas != null && <>{c.numPaginas} pág. · </>}
                      {c.resumo ? 'resumo pronto' : 'sem resumo ainda'}
                    </p>
                  </div>

                  {c.resumo ? (
                    <div className="flex items-center gap-1">
                      <button
                        className="btn-secundario text-sm"
                        onClick={() => setAberto(estaAberto ? null : c.id)}
                      >
                        {estaAberto ? 'Fechar' : 'Ler resumo'}
                        <IconeSetaDireita
                          className={`h-4 w-4 transition-transform ${estaAberto ? 'rotate-90' : ''}`}
                        />
                      </button>
                      <button
                        className="btn-icone"
                        onClick={() => abrirEdicao(c.resumo!)}
                        aria-label="Editar resumo"
                        title="Editar"
                      >
                        <IconeEditar className="h-[18px] w-[18px]" />
                      </button>
                      <button
                        className="btn-icone"
                        onClick={() => gerar(c.id)}
                        disabled={gerandoEste}
                        aria-label="Regerar resumo"
                        title="Regerar com a IA"
                      >
                        <IconeGirar className="h-[18px] w-[18px] text-ambar-600" />
                      </button>
                      <button
                        className="btn-icone hover:!bg-erro/10 hover:!text-erro"
                        onClick={() => setDeletando(c.resumo!)}
                        aria-label="Deletar resumo"
                        title="Deletar"
                      >
                        <IconeLixeira className="h-[18px] w-[18px]" />
                      </button>
                    </div>
                  ) : (
                    <button className="btn-primario" onClick={() => gerar(c.id)} disabled={gerandoEste}>
                      <IconeBrilho className="h-[18px] w-[18px]" /> Gerar resumo
                    </button>
                  )}
                </div>

                {/* Barra de progresso durante a geração */}
                {gerandoEste && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-terra-700">A IA está resumindo o documento…</span>
                      <span className="font-mono tabular-nums text-terra-500">{Math.round(prog)}%</span>
                    </div>
                    <BarraProgresso valor={prog} duracao={progDur} />
                  </div>
                )}

                {/* Resumo expandido */}
                <AnimatePresence>
                  {estaAberto && c.resumo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <ResumoView resumo={c.resumo} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Editar resumo */}
      <Modal aberto={!!editando} onFechar={() => setEditando(null)} titulo="Editar resumo" largura="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Título</label>
            <input className="campo" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Introdução</label>
            <textarea className="campo" rows={4} value={editIntro} onChange={(e) => setEditIntro(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">
              Palavras-chave (separadas por vírgula)
            </label>
            <input className="campo" value={editChaves} onChange={(e) => setEditChaves(e.target.value)} />
          </div>
          <p className="text-xs text-terra-400">
            Para reescrever os tópicos, use o botão de regerar (a IA refaz o resumo).
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn-secundario" onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button className="btn-primario" onClick={salvarEdicao} disabled={ocupado}>
              {ocupado ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        aberto={!!deletando}
        titulo="Deletar resumo?"
        mensagem="O resumo será removido. Você pode gerar de novo a qualquer momento."
        textoConfirmar="Deletar"
        perigo
        carregando={ocupado}
        onConfirmar={confirmarDelecao}
        onCancelar={() => setDeletando(null)}
      />
    </div>
  );
}

function ResumoView({ resumo }: { resumo: ResumoDTO }) {
  return (
    <div className="mt-4 space-y-5 border-t border-terra-500/10 pt-4">
      <div>
        <h2 className="mb-1 font-display text-xl font-bold text-terra-900">{resumo.titulo}</h2>
        <p className="leading-relaxed text-terra-700">{resumo.introducao}</p>
      </div>

      {resumo.palavrasChave.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resumo.palavrasChave.map((p, i) => (
            <span
              key={i}
              className="rounded-full border border-ambar-400/40 bg-ambar-200/40 px-2.5 py-0.5 text-xs font-medium text-ambar-700"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {resumo.topicos.map((t, i) => (
          <div key={i}>
            <h3 className="mb-1.5 flex items-center gap-2 font-display font-semibold text-salvia-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-salvia-100 font-mono text-xs text-salvia-700">
                {i + 1}
              </span>
              {t.titulo}
            </h3>
            <ul className="space-y-1 pl-8">
              {t.pontos.map((p, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-terra-800">
                  <IconeCheck className="mt-0.5 h-4 w-4 shrink-0 text-salvia-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

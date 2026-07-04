'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { AssuntoMapeado, ConteudoResumo } from '@/types';

const MAX_PDF_MB = 4;

type Etapa = 'upload' | 'mapeando' | 'assuntos' | 'gerando' | 'pronto';

export default function ConteudosPage() {
  const [conteudos, setConteudos] = useState<ConteudoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  // wizard de novo conteúdo
  const [wizardAberto, setWizardAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  const [assuntos, setAssuntos] = useState<AssuntoMapeado[]>([]);
  const [gerarCards, setGerarCards] = useState(true);
  const [gerarQA, setGerarQA] = useState(true);
  const [erro, setErro] = useState('');
  const [progresso, setProgresso] = useState('');

  // edição / deleção
  const [editando, setEditando] = useState<ConteudoResumo | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [deletando, setDeletando] = useState<ConteudoResumo | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const res = await fetch('/api/conteudos');
    if (res.ok) {
      const data = await res.json();
      setConteudos(data.conteudos);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirWizard() {
    setEtapa('upload');
    setTitulo('');
    setDescricao('');
    setPdfBase64('');
    setAssuntos([]);
    setGerarCards(true);
    setGerarQA(true);
    setErro('');
    setWizardAberto(true);
  }

  async function aoEscolherPdf(e: React.ChangeEvent<HTMLInputElement>) {
    setErro('');
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.type !== 'application/pdf') {
      setErro('Envie um arquivo PDF.');
      return;
    }
    if (arquivo.size > MAX_PDF_MB * 1024 * 1024) {
      setErro(`PDF muito grande (máx. ${MAX_PDF_MB}MB nesta versão). Divida o arquivo e envie em partes.`);
      return;
    }
    const buffer = await arquivo.arrayBuffer();
    let binario = '';
    const bytes = new Uint8Array(buffer);
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binario += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    setPdfBase64(btoa(binario));
    if (!titulo) setTitulo(arquivo.name.replace(/\.pdf$/i, ''));
  }

  async function mapearAssuntos() {
    if (!pdfBase64 || !titulo.trim()) {
      setErro('Escolha um PDF e dê um título.');
      return;
    }
    setErro('');
    setEtapa('mapeando');
    const res = await fetch('/api/ia/mapear-assuntos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64 }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error || 'Falha ao analisar o PDF.');
      setEtapa('upload');
      return;
    }
    const data = await res.json();
    setAssuntos(data.assuntos || []);
    setEtapa('assuntos');
  }

  async function gerarMaterial() {
    if (assuntos.length === 0) {
      setErro('Mantenha pelo menos um assunto.');
      return;
    }
    if (!gerarCards && !gerarQA) {
      setErro('Escolha gerar Cards, Q&A ou ambos.');
      return;
    }
    setErro('');
    setEtapa('gerando');
    try {
      setProgresso('Criando conteúdo…');
      const resConteudo = await fetch('/api/conteudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          assuntos: assuntos.map((a) => a.nome),
        }),
      });
      if (!resConteudo.ok) throw new Error('Falha ao salvar conteúdo');
      const { conteudo } = await resConteudo.json();
      const nomes = assuntos.map((a) => a.nome);

      if (gerarCards) {
        setProgresso('Gerando flashcards com a IA… (pode levar um minuto)');
        const r = await fetch('/api/ia/gerar-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conteudoId: conteudo.id, pdfBase64, assuntos: nomes }),
        });
        if (!r.ok) throw new Error('Falha ao gerar flashcards');
      }
      if (gerarQA) {
        setProgresso('Gerando perguntas & respostas com a IA… (pode levar um minuto)');
        const r = await fetch('/api/ia/gerar-qa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conteudoId: conteudo.id, pdfBase64, assuntos: nomes }),
        });
        if (!r.ok) throw new Error('Falha ao gerar Q&A');
      }

      setEtapa('pronto');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado');
      setEtapa('assuntos');
    }
  }

  async function salvarEdicao() {
    if (!editando) return;
    setOcupado(true);
    await fetch(`/api/conteudos/${editando.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: editTitulo, descricao: editDescricao }),
    });
    setOcupado(false);
    setEditando(null);
    carregar();
  }

  async function confirmarDelecao() {
    if (!deletando) return;
    setOcupado(true);
    await fetch(`/api/conteudos/${deletando.id}`, { method: 'DELETE' });
    setOcupado(false);
    setDeletando(null);
    carregar();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-terra-800">Meus Conteúdos</h1>
        <button className="btn-primario" onClick={abrirWizard}>
          + Adicionar conteúdo
        </button>
      </div>

      {carregando ? (
        <Spinner texto="Carregando conteúdos…" />
      ) : conteudos.length === 0 ? (
        <div className="cartao text-center text-terra-500">
          <p className="mb-2 text-3xl">🌱</p>
          <p>Nenhum conteúdo ainda. Envie seu primeiro PDF e comece a estudar!</p>
        </div>
      ) : (
        <motion.div
          className="grid gap-4 sm:grid-cols-2"
          initial="oculto"
          animate="visivel"
          variants={{ visivel: { transition: { staggerChildren: 0.06 } } }}
        >
          {conteudos.map((c) => (
            <motion.div
              key={c.id}
              className="cartao flex flex-col"
              variants={{ oculto: { opacity: 0, y: 12 }, visivel: { opacity: 1, y: 0 } }}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-semibold text-terra-900">{c.titulo}</h2>
                <div className="flex shrink-0 gap-1 text-sm">
                  <button
                    className="rounded px-2 py-1 text-terra-500 hover:bg-creme-200"
                    onClick={() => {
                      setEditando(c);
                      setEditTitulo(c.titulo);
                      setEditDescricao(c.descricao || '');
                    }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="rounded px-2 py-1 text-terra-500 hover:bg-erro/10"
                    onClick={() => setDeletando(c)}
                    title="Deletar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {c.descricao && <p className="mb-3 text-sm text-terra-500">{c.descricao}</p>}
              <p className="mb-4 text-xs text-terra-500">
                {c._count.assuntos} assuntos · {c._count.cards} cards · {c._count.simulados} simulados
              </p>
              <div className="mt-auto flex gap-2">
                <Link href={`/conteudos/${c.id}/cards`} className="btn-secundario flex-1 text-center text-sm">
                  🃏 Flashcards
                </Link>
                <Link href={`/conteudos/${c.id}/qa`} className="btn-secundario flex-1 text-center text-sm">
                  💬 Q&A
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Wizard: adicionar conteúdo */}
      <Modal
        aberto={wizardAberto}
        onFechar={() => etapa !== 'mapeando' && etapa !== 'gerando' && setWizardAberto(false)}
        titulo="Adicionar conteúdo"
        largura="max-w-xl"
      >
        {etapa === 'upload' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-terra-700">Arquivo PDF (máx. {MAX_PDF_MB}MB)</label>
              <input type="file" accept="application/pdf" onChange={aoEscolherPdf} className="campo" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-terra-700">Título</label>
              <input className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Estatuto dos Militares — Lei 10.990" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-terra-700">Descrição (opcional)</label>
              <input className="campo" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            {erro && <p className="text-sm text-erro">{erro}</p>}
            <button className="btn-primario w-full" onClick={mapearAssuntos} disabled={!pdfBase64}>
              Analisar PDF →
            </button>
          </div>
        )}

        {etapa === 'mapeando' && <Spinner texto="A IA está lendo o PDF e mapeando os assuntos…" />}

        {etapa === 'assuntos' && (
          <div className="space-y-4">
            <p className="text-sm text-terra-700">
              Assuntos detectados — ajuste antes de gerar (remova o que não interessa):
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {assuntos.map((a, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-creme-200 p-2">
                  <input
                    className="campo flex-1 !py-1 text-sm"
                    value={a.nome}
                    onChange={(e) =>
                      setAssuntos((prev) => prev.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))
                    }
                  />
                  <button
                    className="shrink-0 rounded px-2 text-terra-500 hover:text-erro"
                    onClick={() => setAssuntos((prev) => prev.filter((_, j) => j !== i))}
                    title="Remover assunto"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="text-sm font-medium text-salvia-600 hover:underline"
              onClick={() => setAssuntos((prev) => [...prev, { nome: '', descricao: '' }])}
            >
              + Adicionar assunto manualmente
            </button>
            <div className="flex gap-4 rounded-lg bg-creme-200 p-3">
              <label className="flex items-center gap-2 text-sm text-terra-800">
                <input type="checkbox" checked={gerarCards} onChange={(e) => setGerarCards(e.target.checked)} />
                🃏 Flashcards
              </label>
              <label className="flex items-center gap-2 text-sm text-terra-800">
                <input type="checkbox" checked={gerarQA} onChange={(e) => setGerarQA(e.target.checked)} />
                💬 Perguntas & Respostas
              </label>
            </div>
            {erro && <p className="text-sm text-erro">{erro}</p>}
            <div className="flex gap-3">
              <button className="btn-secundario flex-1" onClick={() => setEtapa('upload')}>
                ← Voltar
              </button>
              <button className="btn-primario flex-1" onClick={gerarMaterial}>
                Gerar material ✨
              </button>
            </div>
          </div>
        )}

        {etapa === 'gerando' && <Spinner texto={progresso} />}

        {etapa === 'pronto' && (
          <div className="space-y-4 text-center">
            <p className="text-4xl">🎉</p>
            <p className="font-medium text-terra-800">Material gerado e salvo! Bons estudos!</p>
            <button className="btn-primario w-full" onClick={() => setWizardAberto(false)}>
              Fechar
            </button>
          </div>
        )}
      </Modal>

      {/* Editar conteúdo */}
      <Modal aberto={!!editando} onFechar={() => setEditando(null)} titulo="Editar conteúdo">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Título</label>
            <input className="campo" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Descrição</label>
            <input className="campo" value={editDescricao} onChange={(e) => setEditDescricao(e.target.value)} />
          </div>
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

      {/* Confirmação de deleção */}
      <ConfirmDialog
        aberto={!!deletando}
        titulo="Deletar conteúdo?"
        mensagem={`"${deletando?.titulo}" será deletado junto com todos os seus cards, perguntas e simulados. Essa ação não pode ser desfeita.`}
        textoConfirmar="Deletar tudo"
        perigo
        carregando={ocupado}
        onConfirmar={confirmarDelecao}
        onCancelar={() => setDeletando(null)}
      />
    </div>
  );
}

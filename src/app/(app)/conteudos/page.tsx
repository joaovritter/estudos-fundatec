'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  IconeMais,
  IconeLivro,
  IconeEditar,
  IconeLixeira,
  IconeCartas,
  IconeConversa,
  IconeBrilho,
  IconeCheck,
  IconeX,
  IconeSetaEsquerda,
} from '@/components/ui/Icones';
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

      // Geramos em LOTES de assuntos (não todos de uma vez): cada chamada à IA
      // fica curta e não estoura o tempo limite da função (evita erro 504).
      const LOTE = 2;
      const lotes: string[][] = [];
      for (let i = 0; i < nomes.length; i += LOTE) lotes.push(nomes.slice(i, i + LOTE));

      let falhas = 0;

      async function processar(rota: string, rotulo: string) {
        let feitos = 0;
        for (const lote of lotes) {
          setProgresso(
            `Gerando ${rotulo} com a IA… ${feitos}/${nomes.length} assuntos (${lote.join(', ')})`
          );
          try {
            const r = await fetch(rota, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conteudoId: conteudo.id, pdfBase64, assuntos: lote }),
            });
            if (!r.ok) falhas++;
          } catch {
            falhas++;
          }
          feitos += lote.length;
        }
      }

      if (gerarCards) await processar('/api/ia/gerar-cards', 'flashcards');
      if (gerarQA) await processar('/api/ia/gerar-qa', 'perguntas & respostas');

      await carregar();
      if (falhas > 0) {
        // Material parcial: parte dos lotes falhou, mas o que deu certo já está salvo.
        setErro(
          `Alguns trechos não foram gerados (${falhas} ${falhas === 1 ? 'lote' : 'lotes'}). ` +
            'O restante já está salvo — você pode adicionar o material que faltou depois.'
        );
        setEtapa('assuntos');
      } else {
        setEtapa('pronto');
      }
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
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-terra-900">
          Meus <span className="grifo">Conteúdos</span>
        </h1>
        <button className="btn-primario" onClick={abrirWizard}>
          <IconeMais className="h-5 w-5" />
          <span className="hidden sm:inline">Adicionar conteúdo</span>
          <span className="sm:hidden">Adicionar</span>
        </button>
      </div>

      {carregando ? (
        <Spinner texto="Carregando conteúdos…" />
      ) : conteudos.length === 0 ? (
        <div className="cartao flex flex-col items-center py-10 text-center text-terra-500">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-salvia-100 text-salvia-600">
            <IconeLivro className="h-7 w-7" />
          </span>
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
                <h2 className="font-display text-lg font-semibold text-terra-900">{c.titulo}</h2>
                <div className="flex shrink-0 gap-0.5">
                  <button
                    className="btn-icone"
                    onClick={() => {
                      setEditando(c);
                      setEditTitulo(c.titulo);
                      setEditDescricao(c.descricao || '');
                    }}
                    aria-label={`Editar ${c.titulo}`}
                    title="Editar"
                  >
                    <IconeEditar className="h-[18px] w-[18px]" />
                  </button>
                  <button
                    className="btn-icone hover:!bg-erro/10 hover:!text-erro"
                    onClick={() => setDeletando(c)}
                    aria-label={`Deletar ${c.titulo}`}
                    title="Deletar"
                  >
                    <IconeLixeira className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
              {c.descricao && <p className="mb-3 text-sm text-terra-500">{c.descricao}</p>}
              <p className="mb-4 text-xs text-terra-500">
                {c._count.assuntos} assuntos · {c._count.cards} cards · {c._count.simulados} simulados
              </p>
              <div className="mt-auto flex gap-2">
                <Link href={`/conteudos/${c.id}/cards`} className="btn-secundario flex-1 text-sm">
                  <IconeCartas className="h-[18px] w-[18px] text-salvia-600" /> Flashcards
                </Link>
                <Link href={`/conteudos/${c.id}/qa`} className="btn-secundario flex-1 text-sm">
                  <IconeConversa className="h-[18px] w-[18px] text-salvia-600" /> Q&A
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
                    className="btn-icone !h-9 !w-9 shrink-0 hover:!text-erro"
                    onClick={() => setAssuntos((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remover assunto ${a.nome || i + 1}`}
                    title="Remover assunto"
                  >
                    <IconeX className="h-4 w-4" />
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
            <div className="flex flex-wrap gap-4 rounded-xl bg-creme-200 p-3">
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-terra-800">
                <input type="checkbox" checked={gerarCards} onChange={(e) => setGerarCards(e.target.checked)} />
                <IconeCartas className="h-[18px] w-[18px] text-salvia-600" /> Flashcards
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-terra-800">
                <input type="checkbox" checked={gerarQA} onChange={(e) => setGerarQA(e.target.checked)} />
                <IconeConversa className="h-[18px] w-[18px] text-salvia-600" /> Perguntas & Respostas
              </label>
            </div>
            {erro && <p className="text-sm text-erro">{erro}</p>}
            <div className="flex gap-3">
              <button className="btn-secundario flex-1" onClick={() => setEtapa('upload')}>
                <IconeSetaEsquerda className="h-[18px] w-[18px]" /> Voltar
              </button>
              <button className="btn-primario flex-1" onClick={gerarMaterial}>
                <IconeBrilho className="h-[18px] w-[18px]" /> Gerar material
              </button>
            </div>
          </div>
        )}

        {etapa === 'gerando' && <Spinner texto={progresso} />}

        {etapa === 'pronto' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-salvia-100 text-acerto">
              <IconeCheck className="h-7 w-7" />
            </span>
            <p className="font-display text-lg font-semibold text-terra-900">
              Material gerado e salvo. <span className="grifo">Bons estudos!</span>
            </p>
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

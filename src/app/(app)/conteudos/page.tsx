'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { upload } from '@vercel/blob/client';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import BarraProgresso from '@/components/ui/BarraProgresso';
import ConfirmDialog from '@/components/ConfirmDialog';

// Visualizador só no cliente (pdfjs usa APIs de browser).
const VisualizadorPDF = dynamic(() => import('@/components/VisualizadorPDF'), {
  ssr: false,
  loading: () => <Spinner texto="Carregando visualizador…" />,
});
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
  IconeOlho,
  IconeSetaEsquerda,
} from '@/components/ui/Icones';
import type { AssuntoMapeado, ConteudoResumo } from '@/types';

// O PDF vai direto do navegador para o Vercel Blob (não passa pelo corpo do
// servidor), então o limite é generoso — cobre PDFs longos e escaneados.
const MAX_PDF_MB = 8;

type Etapa = 'upload' | 'mapeando' | 'assuntos' | 'gerando' | 'pronto';

export default function ConteudosPage() {
  const [conteudos, setConteudos] = useState<ConteudoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  // wizard de novo conteúdo
  const [wizardAberto, setWizardAberto] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [numPaginas, setNumPaginas] = useState<number | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [enviandoPdf, setEnviandoPdf] = useState(false);
  const [assuntos, setAssuntos] = useState<AssuntoMapeado[]>([]);
  const [gerarCards, setGerarCards] = useState(true);
  const [gerarQA, setGerarQA] = useState(true);
  const [erro, setErro] = useState('');
  const [progresso, setProgresso] = useState('');
  const [progressoPct, setProgressoPct] = useState(0);
  const [progressoDur, setProgressoDur] = useState(0.5);

  // edição / deleção / visualização
  const [editando, setEditando] = useState<ConteudoResumo | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [deletando, setDeletando] = useState<ConteudoResumo | null>(null);
  const [vendoPdf, setVendoPdf] = useState<ConteudoResumo | null>(null);
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
    setPdfUrl('');
    setNumPaginas(null);
    setNomeArquivo('');
    setEnviandoPdf(false);
    setAssuntos([]);
    setGerarCards(true);
    setGerarQA(true);
    setErro('');
    setWizardAberto(true);
  }

  // Ao escolher o arquivo, já enviamos direto para o Vercel Blob (o navegador
  // fala com o Blob, sem passar o PDF pelo servidor). Mostra status do envio.
  async function aoEscolherPdf(e: React.ChangeEvent<HTMLInputElement>) {
    setErro('');
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.type !== 'application/pdf') {
      setErro('Envie um arquivo PDF.');
      return;
    }
    if (arquivo.size > MAX_PDF_MB * 1024 * 1024) {
      const tam = (arquivo.size / 1024 / 1024).toFixed(1);
      setErro(`Este PDF tem ${tam}MB e o limite é ${MAX_PDF_MB}MB. Divida em partes e envie cada uma como um conteúdo.`);
      return;
    }

    setPdfUrl('');
    setNumPaginas(null);
    setNomeArquivo(arquivo.name);
    if (!titulo) setTitulo(arquivo.name.replace(/\.pdf$/i, ''));

    setEnviandoPdf(true);
    try {
      const blob = await upload(arquivo.name, arquivo, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
        contentType: 'application/pdf',
      });
      setPdfUrl(blob.url);
    } catch (e) {
      // Mostra a mensagem real do servidor (ex.: Blob não configurado)
      setErro(e instanceof Error ? e.message : 'Falha ao enviar o PDF. Verifique a conexão e tente novamente.');
      setNomeArquivo('');
    } finally {
      setEnviandoPdf(false);
    }
  }

  async function mapearAssuntos() {
    if (!pdfUrl || !titulo.trim()) {
      setErro('Envie um PDF e dê um título.');
      return;
    }
    setErro('');
    setEtapa('mapeando');
    let res: Response;
    try {
      res = await fetch('/api/ia/mapear-assuntos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl }),
      });
    } catch {
      // erro de rede / conexão perdida durante a análise
      setErro('Conexão interrompida ao analisar o PDF. Verifique sua internet e tente de novo.');
      setEtapa('upload');
      return;
    }
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
    setProgressoPct(0);
    setProgressoDur(0.5);
    try {
      setProgresso('Criando conteúdo…');
      const resConteudo = await fetch('/api/conteudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          assuntos: assuntos.map((a) => a.nome),
          pdfUrl,
          numPaginas,
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

      // Progresso: cada lote de cada tipo (cards/QA) é um passo confirmado.
      const numTipos = (gerarCards ? 1 : 0) + (gerarQA ? 1 : 0);
      const totalPassos = lotes.length * numTipos;
      let passos = 0;
      let falhas = 0;
      let msgServidor = ''; // primeira mensagem de erro específica vinda da API

      async function processar(rota: string, rotulo: string) {
        let feitos = 0;
        for (const lote of lotes) {
          setProgresso(
            `Gerando ${rotulo} com a IA… ${feitos}/${nomes.length} assuntos (${lote.join(', ')})`
          );
          // "Creep" otimista: a barra avança devagar em direção ao próximo marco
          // enquanto a IA trabalha, para nunca parecer parada.
          setProgressoDur(28);
          setProgressoPct(((passos + 0.9) / totalPassos) * 100);
          try {
            const r = await fetch(rota, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conteudoId: conteudo.id, assuntos: lote }),
            });
            if (!r.ok) {
              falhas++;
              if (!msgServidor) {
                const d = await r.json().catch(() => ({}));
                if (d.error) msgServidor = d.error;
              }
            }
          } catch {
            falhas++;
          }
          // Marco confirmado: salto rápido até a posição real.
          passos += 1;
          feitos += lote.length;
          setProgressoDur(0.4);
          setProgressoPct((passos / totalPassos) * 100);
        }
      }

      if (gerarCards) await processar('/api/ia/gerar-cards', 'flashcards');
      if (gerarQA) await processar('/api/ia/gerar-qa', 'perguntas & respostas');

      setProgressoPct(100);
      await carregar();
      if (falhas > 0) {
        // Se veio uma mensagem específica do servidor (ex: chave da IA expirada),
        // mostra ela; senão, informa material parcial (o que deu certo foi salvo).
        setErro(
          msgServidor ||
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
                {c.numPaginas != null && <> · {c.numPaginas} pág.</>}
              </p>
              <div className="mt-auto flex gap-2">
                <Link href={`/conteudos/${c.id}/cards`} className="btn-secundario flex-1 text-sm">
                  <IconeCartas className="h-[18px] w-[18px] text-salvia-600" /> Flashcards
                </Link>
                <Link href={`/conteudos/${c.id}/qa`} className="btn-secundario flex-1 text-sm">
                  <IconeConversa className="h-[18px] w-[18px] text-salvia-600" /> Q&A
                </Link>
                {c.pdfUrl && (
                  <button
                    className="btn-secundario !px-3 text-sm"
                    onClick={() => setVendoPdf(c)}
                    aria-label={`Ver PDF de ${c.titulo}`}
                    title="Ver PDF"
                  >
                    <IconeOlho className="h-[18px] w-[18px] text-salvia-600" />
                  </button>
                )}
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
              <input
                type="file"
                accept="application/pdf"
                onChange={aoEscolherPdf}
                disabled={enviandoPdf}
                className="campo"
              />
            </div>

            {/* Status do envio do PDF */}
            {enviandoPdf && (
              <div className="flex items-center gap-2 rounded-xl bg-creme-200 p-3 text-sm text-terra-700">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-salvia-500 border-t-transparent" />
                Enviando <span className="font-medium">{nomeArquivo}</span> para o servidor…
              </div>
            )}
            {pdfUrl && !enviandoPdf && (
              <div className="space-y-3 rounded-xl border border-salvia-500/30 bg-salvia-100/50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <IconeCheck className="h-5 w-5 shrink-0 text-acerto" />
                  <span className="flex-1 text-terra-800">
                    <span className="font-medium">PDF enviado.</span>{' '}
                    {numPaginas != null ? `${numPaginas} ${numPaginas === 1 ? 'página' : 'páginas'}.` : 'lendo páginas…'}
                  </span>
                </div>
                <VisualizadorPDF url={pdfUrl} largura={340} onCarregado={setNumPaginas} />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-terra-700">Título</label>
              <input className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Estatuto dos Militares — Lei 10.990" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-terra-700">Descrição (opcional)</label>
              <input className="campo" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            {erro && <p className="text-sm text-erro">{erro}</p>}
            <button className="btn-primario w-full" onClick={mapearAssuntos} disabled={!pdfUrl || enviandoPdf}>
              <IconeBrilho className="h-[18px] w-[18px]" /> Analisar PDF
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

        {etapa === 'gerando' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-terra-800">Processando com a IA</span>
              <span className="font-mono tabular-nums text-terra-500">{Math.round(progressoPct)}%</span>
            </div>
            <BarraProgresso valor={progressoPct} duracao={progressoDur} />
            <p className="text-sm text-terra-500">{progresso}</p>
            <p className="text-xs text-terra-400">
              Conteúdos com muitos assuntos podem levar alguns minutos. Pode deixar a aba aberta —
              o material é salvo à medida que fica pronto.
            </p>
          </div>
        )}

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
        mensagem={`"${deletando?.titulo}" será deletado junto com todos os seus cards, perguntas, simulados e o PDF. Essa ação não pode ser desfeita.`}
        textoConfirmar="Deletar tudo"
        perigo
        carregando={ocupado}
        onConfirmar={confirmarDelecao}
        onCancelar={() => setDeletando(null)}
      />

      {/* Visualização do PDF */}
      <Modal
        aberto={!!vendoPdf}
        onFechar={() => setVendoPdf(null)}
        titulo={vendoPdf?.titulo}
        largura="max-w-2xl"
      >
        {vendoPdf?.pdfUrl && <VisualizadorPDF url={vendoPdf.pdfUrl} largura={560} />}
      </Modal>
    </div>
  );
}

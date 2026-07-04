'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Flashcard from '@/components/Flashcard';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  IconeSetaEsquerda,
  IconeSetaDireita,
  IconeCartas,
  IconeEditar,
  IconeLixeira,
  IconeBrilho,
  IconeMedalha,
} from '@/components/ui/Icones';
import type { CardDTO } from '@/types';

export default function CardsPage() {
  const { id } = useParams<{ id: string }>();
  const [titulo, setTitulo] = useState('');
  const [cards, setCards] = useState<CardDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [assuntoAtivo, setAssuntoAtivo] = useState<string>('todos');
  const [indice, setIndice] = useState(0);

  // ações sobre o card atual
  const [confirmReformular, setConfirmReformular] = useState(false);
  const [confirmEditar, setConfirmEditar] = useState(false);
  const [confirmDeletar, setConfirmDeletar] = useState(false);
  const [editAberto, setEditAberto] = useState(false);
  const [editFrente, setEditFrente] = useState('');
  const [editVerso, setEditVerso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [fimDeSessao, setFimDeSessao] = useState(false);

  const carregar = useCallback(async () => {
    const res = await fetch(`/api/conteudos/${id}`);
    if (res.ok) {
      const { conteudo } = await res.json();
      setTitulo(conteudo.titulo);
      setCards(conteudo.cards);
    }
    setCarregando(false);
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const assuntos = useMemo(
    () => Array.from(new Set(cards.map((c) => c.assuntoNome).filter(Boolean))) as string[],
    [cards]
  );
  const filtrados = useMemo(
    () => (assuntoAtivo === 'todos' ? cards : cards.filter((c) => c.assuntoNome === assuntoAtivo)),
    [cards, assuntoAtivo]
  );
  const atual = filtrados[Math.min(indice, filtrados.length - 1)];

  function avancar() {
    if (indice + 1 >= filtrados.length) {
      setFimDeSessao(true);
    } else {
      setIndice((i) => i + 1);
    }
  }

  async function reformular() {
    if (!atual) return;
    setOcupado(true);
    const res = await fetch('/api/ia/reformular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'card', cardId: atual.id }),
    });
    setOcupado(false);
    setConfirmReformular(false);
    if (res.ok) {
      const { card } = await res.json();
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    }
  }

  async function salvarEdicao() {
    if (!atual) return;
    setOcupado(true);
    const res = await fetch(`/api/cards/${atual.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frente: editFrente, verso: editVerso }),
    });
    setOcupado(false);
    setConfirmEditar(false);
    setEditAberto(false);
    if (res.ok) {
      const { card } = await res.json();
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    }
  }

  async function deletar() {
    if (!atual) return;
    setOcupado(true);
    await fetch(`/api/cards/${atual.id}`, { method: 'DELETE' });
    setOcupado(false);
    setConfirmDeletar(false);
    setCards((prev) => prev.filter((c) => c.id !== atual.id));
    setIndice((i) => Math.max(0, Math.min(i, filtrados.length - 2)));
  }

  if (carregando) return <Spinner texto="Carregando flashcards…" />;

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
          <IconeCartas className="h-6 w-6 text-ambar-600" /> {titulo}
        </h1>
      </div>

      {cards.length === 0 ? (
        <div className="cartao text-center text-terra-500">
          Este conteúdo ainda não tem flashcards.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {['todos', ...assuntos].map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAssuntoAtivo(a);
                  setIndice(0);
                  setFimDeSessao(false);
                }}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  assuntoAtivo === a
                    ? 'bg-salvia-600 text-creme-50'
                    : 'bg-creme-200 text-terra-700 hover:bg-creme-300'
                }`}
              >
                {a === 'todos' ? `Todos (${cards.length})` : a}
              </button>
            ))}
          </div>

          {fimDeSessao ? (
            <div className="cartao mx-auto flex max-w-xl flex-col items-center py-8 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-ambar-200/60 text-ambar-600">
                <IconeMedalha className="h-7 w-7" />
              </span>
              <p className="mb-1 font-display text-lg font-semibold text-terra-900">
                Sessão completa — <span className="grifo">mandou bem!</span>
              </p>
              <p className="mb-4 text-sm text-terra-500">
                Você revisou {filtrados.length} {filtrados.length === 1 ? 'card' : 'cards'}. A repetição é o segredo da aprovação.
              </p>
              <button
                className="btn-primario"
                onClick={() => {
                  setIndice(0);
                  setFimDeSessao(false);
                }}
              >
                Revisar de novo
              </button>
            </div>
          ) : (
            atual && (
              <div className="space-y-4">
                <p className="text-center text-sm text-terra-500">
                  {indice + 1} de {filtrados.length}
                  {atual.assuntoNome && <span> · {atual.assuntoNome}</span>}
                </p>
                <Flashcard chave={atual.id + atual.frente} frente={atual.frente} verso={atual.verso} />
                <div className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2">
                  <button
                    className="btn-secundario"
                    onClick={() => setIndice((i) => Math.max(0, i - 1))}
                    disabled={indice === 0}
                  >
                    <IconeSetaEsquerda className="h-[18px] w-[18px]" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <div className="flex gap-1">
                    <button
                      className="btn-secundario !px-3 text-sm"
                      onClick={() => setConfirmReformular(true)}
                      title="A IA gera uma nova versão deste card"
                    >
                      <IconeBrilho className="h-[18px] w-[18px] text-ambar-600" />
                      <span className="hidden sm:inline">Reformular</span>
                    </button>
                    <button
                      className="btn-icone"
                      onClick={() => {
                        setEditFrente(atual.frente);
                        setEditVerso(atual.verso);
                        setEditAberto(true);
                      }}
                      aria-label="Editar card"
                      title="Editar card"
                    >
                      <IconeEditar className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      className="btn-icone hover:!bg-erro/10 hover:!text-erro"
                      onClick={() => setConfirmDeletar(true)}
                      aria-label="Deletar card"
                      title="Deletar card"
                    >
                      <IconeLixeira className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                  <button className="btn-primario" onClick={avancar}>
                    <span className="hidden sm:inline">Próximo</span>
                    <IconeSetaDireita className="h-[18px] w-[18px]" />
                  </button>
                </div>
              </div>
            )
          )}
        </>
      )}

      {/* Editar card */}
      <Modal aberto={editAberto} onFechar={() => setEditAberto(false)} titulo="Editar card">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Frente</label>
            <textarea className="campo" rows={3} value={editFrente} onChange={(e) => setEditFrente(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-terra-700">Verso</label>
            <textarea className="campo" rows={4} value={editVerso} onChange={(e) => setEditVerso(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secundario" onClick={() => setEditAberto(false)}>
              Cancelar
            </button>
            <button className="btn-primario" onClick={() => setConfirmEditar(true)}>
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        aberto={confirmEditar}
        titulo="Salvar edição?"
        mensagem="O card será atualizado com o texto editado."
        textoConfirmar="Salvar"
        carregando={ocupado}
        onConfirmar={salvarEdicao}
        onCancelar={() => setConfirmEditar(false)}
      />
      <ConfirmDialog
        aberto={confirmReformular}
        titulo="Reformular card?"
        mensagem="A IA vai gerar uma nova versão deste card e SUBSTITUIR a atual."
        textoConfirmar="Reformular"
        carregando={ocupado}
        onConfirmar={reformular}
        onCancelar={() => setConfirmReformular(false)}
      />
      <ConfirmDialog
        aberto={confirmDeletar}
        titulo="Deletar card?"
        mensagem="Este card será removido permanentemente."
        textoConfirmar="Deletar"
        perigo
        carregando={ocupado}
        onConfirmar={deletar}
        onCancelar={() => setConfirmDeletar(false)}
      />
    </div>
  );
}

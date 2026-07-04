import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import {
  gerarJSON,
  schemaReformularCard,
  schemaReformularQA,
} from '@/lib/gemini';
import { promptReformularCard, promptReformularQA } from '@/lib/prompts';

export const maxDuration = 120;

// Reformular card: gera nova versão e SUBSTITUI (padrão definido na spec).
// Reformular Q&A: gera variação nova (versao = max + 1) e ADICIONA ao bloco.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { tipo, cardId, blocoId } = await req.json();

    if (tipo === 'card') {
      const card = await prisma.card.findFirst({
        where: { id: cardId, conteudo: { userId } },
      });
      if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });

      const novo = await gerarJSON<{ frente: string; verso: string }>({
        prompt: promptReformularCard(card.frente, card.verso),
        schema: schemaReformularCard,
      });

      const atualizado = await prisma.card.update({
        where: { id: card.id },
        data: { frente: novo.frente, verso: novo.verso },
      });
      return NextResponse.json({ card: atualizado });
    }

    if (tipo === 'qa') {
      const bloco = await prisma.blocoQA.findFirst({
        where: { id: blocoId, assunto: { conteudo: { userId } } },
        include: { variacoes: { orderBy: { versao: 'asc' } } },
      });
      if (!bloco) return NextResponse.json({ error: 'Bloco não encontrado' }, { status: 404 });

      const nova = await gerarJSON<{ pergunta: string; resposta: string }>({
        prompt: promptReformularQA(bloco.variacoes),
        schema: schemaReformularQA,
      });

      const proximaVersao = Math.max(...bloco.variacoes.map((v) => v.versao), 0) + 1;
      const variacao = await prisma.variacaoQA.create({
        data: {
          blocoId: bloco.id,
          versao: proximaVersao,
          pergunta: nova.pergunta,
          resposta: nova.resposta,
        },
      });
      return NextResponse.json({ variacao });
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch (e) {
    console.error('reformular:', e);
    return NextResponse.json({ error: 'Falha ao reformular. Tente novamente.' }, { status: 500 });
  }
}

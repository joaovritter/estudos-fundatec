import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { gerarJSON, mensagemErroIA, schemaGerarCards } from '@/lib/gemini';
import { promptGerarFlashcards } from '@/lib/prompts';

export const maxDuration = 120;

interface CardGerado {
  assunto: string;
  frente: string;
  verso: string;
}

// Gera flashcards a partir do PDF e PERSISTE no banco (não se chama a IA de novo).
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { conteudoId, assuntos } = await req.json();
    if (!conteudoId || !Array.isArray(assuntos) || assuntos.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const conteudo = await prisma.conteudo.findFirst({ where: { id: conteudoId, userId } });
    if (!conteudo) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
    if (!conteudo.pdfUrl) return NextResponse.json({ error: 'PDF do conteúdo não encontrado' }, { status: 400 });

    const { cards } = await gerarJSON<{ cards: CardGerado[] }>({
      prompt: promptGerarFlashcards(assuntos),
      schema: schemaGerarCards,
      pdfUrl: conteudo.pdfUrl,
    });

    await prisma.card.createMany({
      data: cards.map((c) => ({
        conteudoId,
        assuntoNome: c.assunto,
        frente: c.frente,
        verso: c.verso,
      })),
    });

    return NextResponse.json({ ok: true, total: cards.length });
  } catch (e) {
    console.error('gerar-cards:', e);
    const { error, status } = mensagemErroIA(e, 'Falha ao gerar flashcards. Tente novamente.');
    return NextResponse.json({ error }, { status });
  }
}

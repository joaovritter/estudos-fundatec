import { NextResponse } from 'next/server';
import { Type, type Schema } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { gerarJSON, mensagemErroIA, schemaGerarCards, schemaGerarQA } from '@/lib/gemini';
import { promptGerarMaterial } from '@/lib/prompts';

export const maxDuration = 120;

interface CardGerado {
  assunto: string;
  frente: string;
  verso: string;
}
interface BlocoGerado {
  assunto: string;
  id_bloco: number;
  variacoes: { versao: number; pergunta: string; resposta: string }[];
}

// Gera flashcards E/OU Q&A numa ÚNICA chamada à IA por lote de assuntos —
// metade das chamadas (economiza cota) vs. gerar cada um separadamente.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { conteudoId, assuntos, gerarCards, gerarQA } = await req.json();
    if (!conteudoId || !Array.isArray(assuntos) || assuntos.length === 0 || (!gerarCards && !gerarQA)) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const conteudo = await prisma.conteudo.findFirst({
      where: { id: conteudoId, userId },
      include: { assuntos: true },
    });
    if (!conteudo) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
    if (!conteudo.pdfUrl) return NextResponse.json({ error: 'PDF do conteúdo não encontrado' }, { status: 400 });

    // Monta o schema só com o que foi pedido.
    const properties: Record<string, Schema> = {};
    const required: string[] = [];
    if (gerarCards) {
      properties.cards = schemaGerarCards.properties!.cards;
      required.push('cards');
    }
    if (gerarQA) {
      properties.blocos = schemaGerarQA.properties!.blocos;
      required.push('blocos');
    }
    const schema: Schema = { type: Type.OBJECT, properties, required };

    const resultado = await gerarJSON<{ cards?: CardGerado[]; blocos?: BlocoGerado[] }>({
      prompt: promptGerarMaterial(assuntos, !!gerarCards, !!gerarQA),
      schema,
      pdfPathname: conteudo.pdfUrl,
    });

    let totalCards = 0;
    let totalBlocos = 0;

    if (gerarCards && resultado.cards?.length) {
      await prisma.card.createMany({
        data: resultado.cards.map((c) => ({
          conteudoId,
          assuntoNome: c.assunto,
          frente: c.frente,
          verso: c.verso,
        })),
      });
      totalCards = resultado.cards.length;
    }

    if (gerarQA && resultado.blocos?.length) {
      const porNome = new Map(conteudo.assuntos.map((a) => [a.nome.toLowerCase().trim(), a.id]));
      for (const bloco of resultado.blocos) {
        const assuntoId = porNome.get(bloco.assunto.toLowerCase().trim());
        if (!assuntoId) continue;
        await prisma.blocoQA.create({
          data: {
            assuntoId,
            idBloco: bloco.id_bloco,
            variacoes: {
              create: bloco.variacoes.map((v, i) => ({
                versao: v.versao || i + 1,
                pergunta: v.pergunta,
                resposta: v.resposta,
              })),
            },
          },
        });
        totalBlocos++;
      }
    }

    return NextResponse.json({ ok: true, totalCards, totalBlocos });
  } catch (e) {
    console.error('gerar-material:', e);
    const { error, status } = mensagemErroIA(e, 'Falha ao gerar o material. Tente novamente.');
    return NextResponse.json({ error }, { status });
  }
}

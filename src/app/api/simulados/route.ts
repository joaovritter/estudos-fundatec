import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { gerarJSON, schemaSimulado } from '@/lib/gemini';
import { promptGerarSimulado } from '@/lib/prompts';
import type { Alternativas } from '@/types';

export const maxDuration = 60;

interface QuestaoGerada {
  enunciado: string;
  alternativas: Alternativas;
  gabarito: string;
  justificativa: string;
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? undefined;

  const simulados = await prisma.simulado.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { iniciadoEm: 'desc' },
    include: { conteudo: { select: { titulo: true } } },
  });

  return NextResponse.json({
    simulados: simulados.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      conteudoTitulo: s.conteudo.titulo,
      assuntos: s.assuntos,
      qtdQuestoes: s.qtdQuestoes,
      tempoLimite: s.tempoLimite,
      status: s.status,
      nota: s.nota,
      acertos: s.acertos,
      total: s.total,
      iniciadoEm: s.iniciadoEm,
      finalizadoEm: s.finalizadoEm,
    })),
  });
}

// Cria o simulado: monta o material a partir do que já está salvo no banco
// (Q&A + cards dos assuntos escolhidos) e gera as questões em LOTES de 5
// para não estourar o tempo limite da função.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { conteudoId, assuntos, qtdQuestoes, tempoLimite } = await req.json();

    if (
      !conteudoId ||
      !Array.isArray(assuntos) ||
      assuntos.length === 0 ||
      !qtdQuestoes ||
      qtdQuestoes < 1 ||
      qtdQuestoes > 30 ||
      !tempoLimite
    ) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const conteudo = await prisma.conteudo.findFirst({
      where: { id: conteudoId, userId },
      include: {
        assuntos: {
          where: { nome: { in: assuntos } },
          include: { blocosQA: { include: { variacoes: true } } },
        },
        cards: { where: { assuntoNome: { in: assuntos } } },
      },
    });
    if (!conteudo) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });

    // Material-fonte: tudo que a IA já extraiu do PDF para esses assuntos
    const partes: string[] = [];
    for (const a of conteudo.assuntos) {
      const qas = a.blocosQA.flatMap((b) =>
        b.variacoes.map((v) => `P: ${v.pergunta}\nR: ${v.resposta}`)
      );
      const cards = conteudo.cards
        .filter((c) => c.assuntoNome === a.nome)
        .map((c) => `${c.frente} → ${c.verso}`);
      if (qas.length || cards.length) {
        partes.push(`### ASSUNTO: ${a.nome}\n${[...qas, ...cards].join('\n\n')}`);
      }
    }

    if (partes.length === 0) {
      return NextResponse.json(
        { error: 'Esses assuntos ainda não têm material gerado (Q&A ou cards). Gere o material primeiro.' },
        { status: 400 }
      );
    }
    const material = partes.join('\n\n');

    // Geração em lotes de 5 questões
    const LOTE = 5;
    const questoes: QuestaoGerada[] = [];
    while (questoes.length < qtdQuestoes) {
      const restantes = Math.min(LOTE, qtdQuestoes - questoes.length);
      const { questoes: novas } = await gerarJSON<{ questoes: QuestaoGerada[] }>({
        prompt:
          promptGerarSimulado(material, restantes) +
          (questoes.length > 0
            ? `\n\nIMPORTANTE: NÃO repita os pontos já cobrados nestas questões anteriores:\n${questoes.map((q) => `- ${q.enunciado}`).join('\n')}`
            : ''),
        schema: schemaSimulado,
      });
      questoes.push(...novas.slice(0, restantes));
      if (novas.length === 0) break; // proteção contra loop infinito
    }

    if (questoes.length === 0) {
      return NextResponse.json({ error: 'A IA não gerou questões. Tente novamente.' }, { status: 500 });
    }

    const simulado = await prisma.simulado.create({
      data: {
        userId,
        conteudoId,
        titulo: `Simulado — ${conteudo.titulo}`,
        assuntos,
        qtdQuestoes: questoes.length,
        tempoLimite,
        questoes: {
          create: questoes.map((q, i) => ({
            ordem: i + 1,
            enunciado: q.enunciado,
            alternativas: q.alternativas as object,
            gabarito: q.gabarito.toUpperCase().trim().charAt(0),
            justificativa: q.justificativa,
          })),
        },
      },
    });

    return NextResponse.json({ simulado: { id: simulado.id } }, { status: 201 });
  } catch (e) {
    console.error('criar simulado:', e);
    return NextResponse.json({ error: 'Falha ao gerar o simulado. Tente novamente.' }, { status: 500 });
  }
}

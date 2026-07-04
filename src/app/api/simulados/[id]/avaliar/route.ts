import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { gerarJSON, schemaAvaliar } from '@/lib/gemini';
import { promptAvaliarSimulado } from '@/lib/prompts';

export const maxDuration = 120;

// Feedback textual rico da IA — OPCIONAL (a correção em si é local e grátis).
// O feedback gerado é persistido em cada questão para não chamar a IA de novo.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const s = await prisma.simulado.findFirst({
      where: { id: params.id, userId },
      include: { questoes: { orderBy: { ordem: 'asc' } } },
    });
    if (!s) return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 });
    if (s.status !== 'finalizado') {
      return NextResponse.json({ error: 'Finalize o simulado antes de pedir avaliação' }, { status: 400 });
    }

    // Já avaliado antes? Devolve do banco (economia de chamadas).
    if (s.questoes.every((q) => q.feedbackIA)) {
      return NextResponse.json({
        feedbacks: s.questoes.map((q) => ({ ordem: q.ordem, feedback: q.feedbackIA })),
      });
    }

    const { feedbacks } = await gerarJSON<{ feedbacks: { ordem: number; feedback: string }[] }>({
      prompt: promptAvaliarSimulado(
        s.questoes.map((q) => ({
          ordem: q.ordem,
          enunciado: q.enunciado,
          gabarito: q.gabarito,
          respostaUsuario: q.respostaUsuario,
          justificativa: q.justificativa,
        }))
      ),
      schema: schemaAvaliar,
    });

    const porOrdem = new Map(feedbacks.map((f) => [f.ordem, f.feedback]));
    await prisma.$transaction(
      s.questoes
        .filter((q) => porOrdem.has(q.ordem))
        .map((q) =>
          prisma.simuladoQuestao.update({
            where: { id: q.id },
            data: { feedbackIA: porOrdem.get(q.ordem) },
          })
        )
    );

    return NextResponse.json({ feedbacks });
  } catch (e) {
    console.error('avaliar simulado:', e);
    return NextResponse.json({ error: 'Falha ao gerar avaliação. Tente novamente.' }, { status: 500 });
  }
}

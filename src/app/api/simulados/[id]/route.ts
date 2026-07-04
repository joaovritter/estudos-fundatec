import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const s = await prisma.simulado.findFirst({
    where: { id: params.id, userId },
    include: {
      conteudo: { select: { titulo: true } },
      questoes: { orderBy: { ordem: 'asc' } },
    },
  });
  if (!s) return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 });

  const finalizado = s.status === 'finalizado';

  return NextResponse.json({
    simulado: {
      id: s.id,
      titulo: s.titulo,
      conteudoId: s.conteudoId,
      conteudoTitulo: s.conteudo.titulo,
      assuntos: s.assuntos,
      qtdQuestoes: s.qtdQuestoes,
      tempoLimite: s.tempoLimite,
      dificuldade: s.dificuldade,
      status: s.status,
      nota: s.nota,
      acertos: s.acertos,
      total: s.total,
      iniciadoEm: s.iniciadoEm,
      finalizadoEm: s.finalizadoEm,
      questoes: s.questoes.map((q) => ({
        id: q.id,
        ordem: q.ordem,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        // Gabarito e justificativa só saem do servidor após finalizar
        ...(finalizado
          ? {
              gabarito: q.gabarito,
              justificativa: q.justificativa,
              respostaUsuario: q.respostaUsuario,
              correta: q.correta,
              feedbackIA: q.feedbackIA,
            }
          : {}),
      })),
    },
  });
}

// Finaliza o simulado: correção LOCAL contra o gabarito salvo (sem chamar a IA).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const s = await prisma.simulado.findFirst({
    where: { id: params.id, userId },
    include: { questoes: true },
  });
  if (!s) return NextResponse.json({ error: 'Simulado não encontrado' }, { status: 404 });
  if (s.status === 'finalizado') {
    return NextResponse.json({ error: 'Simulado já finalizado' }, { status: 409 });
  }

  const { respostas } = (await req.json()) as { respostas: Record<string, string> };

  let acertos = 0;
  await prisma.$transaction(
    s.questoes.map((q) => {
      const resposta = respostas?.[q.id]?.toUpperCase()?.trim() || null;
      const correta = resposta !== null && resposta === q.gabarito;
      if (correta) acertos++;
      return prisma.simuladoQuestao.update({
        where: { id: q.id },
        data: { respostaUsuario: resposta, correta },
      });
    })
  );

  const total = s.questoes.length;
  const nota = total > 0 ? Math.round((acertos / total) * 1000) / 100 : 0; // escala 0-10

  const atualizado = await prisma.simulado.update({
    where: { id: s.id },
    data: {
      status: 'finalizado',
      nota,
      acertos,
      total,
      finalizadoEm: new Date(),
    },
  });

  return NextResponse.json({
    resultado: { nota: atualizado.nota, acertos, total },
  });
}

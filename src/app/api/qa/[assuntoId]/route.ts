import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

// Lê do banco as variações de Q&A de um assunto — sem chamar a IA.
export async function GET(_req: Request, { params }: { params: { assuntoId: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const assunto = await prisma.assunto.findFirst({
    where: { id: params.assuntoId, conteudo: { userId } },
    include: {
      blocosQA: {
        orderBy: { idBloco: 'asc' },
        include: { variacoes: { orderBy: { versao: 'asc' } } },
      },
    },
  });
  if (!assunto) return NextResponse.json({ error: 'Assunto não encontrado' }, { status: 404 });

  return NextResponse.json({
    assunto: { id: assunto.id, nome: assunto.nome },
    blocos: assunto.blocosQA.map((b) => ({
      id: b.id,
      idBloco: b.idBloco,
      assuntoNome: assunto.nome,
      variacoes: b.variacoes,
    })),
  });
}

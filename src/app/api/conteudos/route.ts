import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const conteudos = await prisma.conteudo.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      assuntos: { select: { id: true, nome: true }, orderBy: { ordem: 'asc' } },
      _count: { select: { cards: true, assuntos: true, simulados: true } },
    },
  });

  return NextResponse.json({ conteudos });
}

// Cria o Conteudo + Assuntos confirmados pelo usuário (após MAPEAR_ASSUNTOS)
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { titulo, descricao, assuntos } = await req.json();
  if (!titulo || !Array.isArray(assuntos) || assuntos.length === 0) {
    return NextResponse.json({ error: 'Título e assuntos são obrigatórios' }, { status: 400 });
  }

  const conteudo = await prisma.conteudo.create({
    data: {
      userId,
      titulo,
      descricao: descricao || null,
      assuntos: {
        create: assuntos.map((nome: string, i: number) => ({ nome, ordem: i })),
      },
    },
    include: { assuntos: { orderBy: { ordem: 'asc' } } },
  });

  return NextResponse.json({ conteudo }, { status: 201 });
}

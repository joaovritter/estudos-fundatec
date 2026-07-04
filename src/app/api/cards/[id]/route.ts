import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const card = await prisma.card.findFirst({
    where: { id: params.id, conteudo: { userId } },
  });
  if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });

  const { frente, verso } = await req.json();
  if (!frente || !verso) {
    return NextResponse.json({ error: 'Frente e verso são obrigatórios' }, { status: 400 });
  }

  const atualizado = await prisma.card.update({
    where: { id: card.id },
    data: { frente, verso },
  });
  return NextResponse.json({ card: atualizado });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const card = await prisma.card.findFirst({
    where: { id: params.id, conteudo: { userId } },
  });
  if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });

  await prisma.card.delete({ where: { id: card.id } });
  return NextResponse.json({ ok: true });
}

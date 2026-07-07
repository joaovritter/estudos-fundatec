import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

async function resumoDoUsuario(id: string, userId: string) {
  return prisma.resumo.findFirst({ where: { id, conteudo: { userId } } });
}

// Editar o resumo manualmente (título, introdução, tópicos, palavras-chave)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const existente = await resumoDoUsuario(params.id, userId);
  if (!existente) return NextResponse.json({ error: 'Resumo não encontrado' }, { status: 404 });

  const { titulo, introducao, topicos, palavrasChave } = await req.json();
  const resumo = await prisma.resumo.update({
    where: { id: params.id },
    data: {
      ...(titulo !== undefined ? { titulo } : {}),
      ...(introducao !== undefined ? { introducao } : {}),
      ...(topicos !== undefined ? { topicos } : {}),
      ...(palavrasChave !== undefined ? { palavrasChave } : {}),
    },
  });
  return NextResponse.json({ resumo });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const existente = await resumoDoUsuario(params.id, userId);
  if (!existente) return NextResponse.json({ error: 'Resumo não encontrado' }, { status: 404 });

  await prisma.resumo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

async function conteudoDoUsuario(id: string, userId: string) {
  return prisma.conteudo.findFirst({ where: { id, userId } });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const conteudo = await prisma.conteudo.findFirst({
    where: { id: params.id, userId },
    include: {
      assuntos: { orderBy: { ordem: 'asc' }, include: { _count: { select: { blocosQA: true } } } },
      cards: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!conteudo) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });

  return NextResponse.json({ conteudo });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const existente = await conteudoDoUsuario(params.id, userId);
  if (!existente) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });

  const { titulo, descricao } = await req.json();
  const conteudo = await prisma.conteudo.update({
    where: { id: params.id },
    data: {
      ...(titulo !== undefined ? { titulo } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
    },
  });

  return NextResponse.json({ conteudo });
}

// Deleção cascateia assuntos, blocos, variações, cards e simulados (onDelete: Cascade)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const existente = await conteudoDoUsuario(params.id, userId);
  if (!existente) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });

  // Apaga o PDF do Blob (não bloqueia a deleção do conteúdo se falhar)
  if (existente.pdfUrl) {
    try {
      await del(existente.pdfUrl);
    } catch (e) {
      console.error('falha ao apagar PDF do Blob:', e);
    }
  }

  await prisma.conteudo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

// Lista os conteúdos do usuário com o resumo (se já gerado). A página de
// Resumos usa isso para mostrar cada PDF e seu resumo / botão de gerar.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const conteudos = await prisma.conteudo.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { resumo: true },
  });

  return NextResponse.json({
    conteudos: conteudos.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      numPaginas: c.numPaginas,
      resumo: c.resumo
        ? {
            id: c.resumo.id,
            conteudoId: c.id,
            titulo: c.resumo.titulo,
            introducao: c.resumo.introducao,
            topicos: c.resumo.topicos,
            palavrasChave: c.resumo.palavrasChave,
            createdAt: c.resumo.createdAt,
            updatedAt: c.resumo.updatedAt,
          }
        : null,
    })),
  });
}

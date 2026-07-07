import { get } from '@vercel/blob';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export const maxDuration = 60;

// Serve um PDF privado do Blob. Autoriza: o usuário logado precisa ter um
// conteúdo que aponte para esse pathname (garante que só o dono acessa).
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const pathname = req.nextUrl.searchParams.get('pathname');
  if (!pathname) return NextResponse.json({ error: 'pathname ausente' }, { status: 400 });

  const dono = await prisma.conteudo.findFirst({
    where: { pdfUrl: pathname, userId },
    select: { id: true },
  });
  if (!dono) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    const result = await get(pathname, { access: 'private' });
    if (!result) {
      console.error('blob get: not found', { pathname });
      return new NextResponse('Não encontrado', { status: 404 });
    }
    if (result.statusCode !== 200) {
      console.error('blob get: statusCode', result.statusCode, { pathname });
      return new NextResponse('Não encontrado', { status: 404 });
    }
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'application/pdf',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('blob get erro:', e, { pathname });
    return new NextResponse('Erro ao carregar PDF', { status: 500 });
  }
}

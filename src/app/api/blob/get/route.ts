import { get } from '@vercel/blob';
import { NextResponse, type NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth';

export const maxDuration = 60;

// Serve um PDF privado do Blob. Só o dono acessa: o pathname sempre começa
// com pdfs/<userId>/, então exigimos que o prefixo bata com o usuário logado.
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const pathname = req.nextUrl.searchParams.get('pathname');
  if (!pathname) return NextResponse.json({ error: 'pathname ausente' }, { status: 400 });
  if (!pathname.startsWith(`pdfs/${userId}/`)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200) {
    return new NextResponse('Não encontrado', { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/pdf',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

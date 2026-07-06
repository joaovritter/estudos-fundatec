import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

// Upload direto do navegador para o Vercel Blob (contorna o limite de body do
// servidor). Esta rota só emite o token de upload e valida tipo/tamanho.
export async function POST(req: Request): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = (await req.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/pdf'],
        maximumSizeInBytes: 8 * 1024 * 1024, // PDF original pode ser maior que o inline
        tokenPayload: JSON.stringify({ userId }),
      }),
      // nada a fazer ao concluir — a URL é salva quando o conteúdo é criado
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Falha no upload' },
      { status: 400 }
    );
  }
}

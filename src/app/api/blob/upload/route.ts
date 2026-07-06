import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

// Upload direto do navegador para o Vercel Blob (contorna o limite de body do
// servidor). Esta rota só emite o token de upload e valida tipo/tamanho.
export async function POST(req: Request): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  // Diagnóstico claro caso o Blob store não esteja conectado ao projeto.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('blob upload: BLOB_READ_WRITE_TOKEN ausente no ambiente');
    return NextResponse.json(
      {
        error:
          'Armazenamento de PDF não configurado. Conecte um Blob store ao projeto na Vercel (Storage → Blob) e faça um novo deploy.',
      },
      { status: 503 }
    );
  }

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
    console.error('blob upload:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Falha no upload' },
      { status: 400 }
    );
  }
}

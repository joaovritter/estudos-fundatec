import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

// Upload direto do navegador para o Vercel Blob (contorna o limite de body do
// servidor). Esta rota só emite o token de upload e valida tipo/tamanho.
export async function POST(req: Request): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  // Diagnóstico claro caso o Blob store não esteja conectado ao projeto.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('blob upload: BLOB_READ_WRITE_TOKEN ausente no ambiente');
    return NextResponse.json(
      {
        error:
          'Armazenamento de PDF não configurado. Conecte um Blob store ao projeto na Vercel (Storage → Blob) e faça um novo deploy.',
      },
      { status: 503 }
    );
  }
  // Diagnóstico: um token válido tem o formato vercel_blob_rw_<storeId>_<secret>.
  // Logamos só o prefixo (storeId não é secreto — aparece nas URLs públicas).
  const formatoOk = token.startsWith('vercel_blob_rw_');
  console.log(
    `blob upload: token prefixo="${token.slice(0, 25)}" formatoOk=${formatoOk} len=${token.length}`
  );
  if (!formatoOk) {
    return NextResponse.json(
      {
        error:
          'O BLOB_READ_WRITE_TOKEN está com formato inválido (deve começar com "vercel_blob_rw_"). Reconecte o Blob store ao projeto na Vercel para gerar o token correto.',
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

import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

// Emite URLs de upload assinadas (presigned) para o navegador enviar o PDF
// DIRETO ao Blob — sem passar pelo corpo do servidor (que limita a ~4.5MB).
// Assim o limite de tamanho fica alto (ver maximumSizeInBytes).
// Autentica via OIDC (issueSignedToken usa VERCEL_OIDC_TOKEN + BLOB_STORE_ID).
export async function POST(req: Request): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = (await req.json()) as HandleUploadPresignedBody;

  try {
    const json = await handleUploadPresigned({
      body,
      request: req,
      // Usuário já autenticado acima; assina um token com permissão de PUT
      // limitado a PDF e a 20MB.
      getSignedToken: async (pathname) => {
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 20 * 1024 * 1024,
        });
        return { token };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    console.error('blob upload:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Falha ao enviar o PDF' },
      { status: 400 }
    );
  }
}

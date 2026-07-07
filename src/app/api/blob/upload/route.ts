import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

export const maxDuration = 60;

// Upload do PDF pelo SERVIDOR até o Vercel Blob (store privado). O put() do
// @vercel/blob v2 autentica via OIDC (VERCEL_OIDC_TOKEN + BLOB_STORE_ID) e
// persiste o blob de forma síncrona e confiável (ao contrário do upload
// presigned, que dependia de um webhook de confirmação e não persistia bem).
export async function POST(req: Request): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Envie um arquivo PDF' }, { status: 400 });
    }

    const nomeSeguro = file.name.replace(/[^\w.\-]+/g, '_');
    const blob = await put(`pdfs/${userId}/${nomeSeguro}`, file, {
      access: 'private',
      contentType: 'application/pdf',
      addRandomSuffix: true,
    });

    return NextResponse.json({ pathname: blob.pathname });
  } catch (e) {
    console.error('blob upload:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Falha ao enviar o PDF' },
      { status: 500 }
    );
  }
}

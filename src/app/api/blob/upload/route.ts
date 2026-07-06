import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';

export const maxDuration = 60;

// Upload do PDF pelo SERVIDOR (não client upload). O put() do @vercel/blob v2
// autentica automaticamente via OIDC (VERCEL_OIDC_TOKEN + BLOB_STORE_ID) quando
// não há BLOB_READ_WRITE_TOKEN — que é o modelo novo do Blob store.
// O client upload (handleUpload) NÃO suporta OIDC, por isso não é usado aqui.
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
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error('blob upload:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Falha ao enviar o PDF' },
      { status: 500 }
    );
  }
}

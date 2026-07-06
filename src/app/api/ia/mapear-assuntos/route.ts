import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { gerarJSON, mensagemErroIA, schemaMapearAssuntos } from '@/lib/gemini';
import { PROMPT_MAPEAR_ASSUNTOS } from '@/lib/prompts';
import type { AssuntoMapeado } from '@/types';

export const maxDuration = 120;

// Só analisa o PDF e devolve os assuntos — nada é salvo ainda.
// O usuário confirma/edita a lista antes de gerar material (evita gerar lixo).
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { pdfBase64 } = await req.json();
    if (!pdfBase64) return NextResponse.json({ error: 'PDF não enviado' }, { status: 400 });

    const resultado = await gerarJSON<{ assuntos: AssuntoMapeado[] }>({
      prompt: PROMPT_MAPEAR_ASSUNTOS,
      schema: schemaMapearAssuntos,
      pdfBase64,
    });

    return NextResponse.json(resultado);
  } catch (e) {
    console.error('mapear-assuntos:', e);
    const { error, status } = mensagemErroIA(e, 'Falha ao analisar o PDF. Tente novamente.');
    return NextResponse.json({ error }, { status });
  }
}

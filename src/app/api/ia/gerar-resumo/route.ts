import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { gerarJSON, mensagemErroIA, schemaResumo } from '@/lib/gemini';
import { PROMPT_GERAR_RESUMO } from '@/lib/prompts';
import type { TopicoResumo } from '@/types';

export const maxDuration = 120;

interface ResumoGerado {
  titulo: string;
  introducao: string;
  topicos: TopicoResumo[];
  palavrasChave: string[];
}

// Gera (ou regera) o resumo de estudo de um conteúdo a partir do PDF e salva.
// Como é 1 resumo por conteúdo (upsert), regerar substitui o anterior.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { conteudoId } = await req.json();
    if (!conteudoId) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });

    const conteudo = await prisma.conteudo.findFirst({ where: { id: conteudoId, userId } });
    if (!conteudo) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
    if (!conteudo.pdfUrl) return NextResponse.json({ error: 'PDF do conteúdo não encontrado' }, { status: 400 });

    const r = await gerarJSON<ResumoGerado>({
      prompt: PROMPT_GERAR_RESUMO,
      schema: schemaResumo,
      pdfPathname: conteudo.pdfUrl,
    });

    const dados = {
      titulo: r.titulo,
      introducao: r.introducao,
      topicos: r.topicos as object,
      palavrasChave: r.palavrasChave ?? [],
    };

    const resumo = await prisma.resumo.upsert({
      where: { conteudoId },
      create: { conteudoId, ...dados },
      update: dados,
    });

    return NextResponse.json({ resumo });
  } catch (e) {
    console.error('gerar-resumo:', e);
    const { error, status } = mensagemErroIA(e, 'Falha ao gerar o resumo. Tente novamente.');
    return NextResponse.json({ error }, { status });
  }
}

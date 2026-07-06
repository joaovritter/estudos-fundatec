import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';
import { gerarJSON, mensagemErroIA, schemaGerarQA } from '@/lib/gemini';
import { promptGerarQA } from '@/lib/prompts';

export const maxDuration = 120;

interface BlocoGerado {
  assunto: string;
  id_bloco: number;
  variacoes: { versao: number; pergunta: string; resposta: string }[];
}

// Gera blocos de Q&A (3 variações cada) a partir do PDF e PERSISTE no banco.
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const { conteudoId, assuntos } = await req.json();
    if (!conteudoId || !Array.isArray(assuntos) || assuntos.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const conteudo = await prisma.conteudo.findFirst({
      where: { id: conteudoId, userId },
      include: { assuntos: true },
    });
    if (!conteudo) return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
    if (!conteudo.pdfUrl) return NextResponse.json({ error: 'PDF do conteúdo não encontrado' }, { status: 400 });

    const { blocos } = await gerarJSON<{ blocos: BlocoGerado[] }>({
      prompt: promptGerarQA(assuntos),
      schema: schemaGerarQA,
      pdfPathname: conteudo.pdfUrl,
    });

    // Mapeia nome do assunto → id (case-insensitive para tolerar variações da IA)
    const porNome = new Map(conteudo.assuntos.map((a) => [a.nome.toLowerCase().trim(), a.id]));

    let totalBlocos = 0;
    for (const bloco of blocos) {
      const assuntoId = porNome.get(bloco.assunto.toLowerCase().trim());
      if (!assuntoId) continue; // assunto não confirmado pelo usuário → descarta

      await prisma.blocoQA.create({
        data: {
          assuntoId,
          idBloco: bloco.id_bloco,
          variacoes: {
            create: bloco.variacoes.map((v, i) => ({
              versao: v.versao || i + 1,
              pergunta: v.pergunta,
              resposta: v.resposta,
            })),
          },
        },
      });
      totalBlocos++;
    }

    return NextResponse.json({ ok: true, totalBlocos });
  } catch (e) {
    console.error('gerar-qa:', e);
    const { error, status } = mensagemErroIA(e, 'Falha ao gerar perguntas. Tente novamente.');
    return NextResponse.json({ error }, { status });
  }
}

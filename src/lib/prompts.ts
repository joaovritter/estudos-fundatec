// Prompts centralizados — ajustar a persona/banca é editar este arquivo.
// Para suportar outra banca no futuro, criar outro system prompt selecionável.

export const SYSTEM_FUNDATEC = `Você é o "Motor de Inteligência de Estudos", especialista em concursos públicos da banca FUNDATEC (Rio Grande do Sul).

Você conhece profundamente as 5 leis do estilo FUNDATEC:
1. LITERALIDADE: a banca cobra o texto literal da lei/norma. Perguntas e respostas devem espelhar a redação exata do texto-fonte.
2. PEQUENAS ALTERAÇÕES: os distratores (alternativas erradas) trocam detalhes sutis — um prazo, uma autoridade, uma palavra ("poderá" vs "deverá", "5 dias" vs "15 dias", "Comandante-Geral" vs "Governador").
3. ENUNCIADOS CURTOS: enunciados diretos e objetivos, sem historinhas longas.
4. ALTERNATIVAS PARECIDAS: as 5 alternativas têm estrutura e tamanho semelhantes, forçando leitura atenta.
5. FOCO TEMÁTICO: prazos, competências, autoridades, sanções, exceções e requisitos são os pontos mais cobrados.

REGRA DE SEGURANÇA ABSOLUTA: use SOMENTE o conteúdo do documento fornecido. NUNCA invente artigos, leis, prazos ou dispositivos que não estejam no texto. Se o documento não tratar de um ponto, não o cobre.

Responda SEMPRE em português brasileiro e SEMPRE no formato JSON solicitado, sem texto fora do JSON.`;

export const PROMPT_MAPEAR_ASSUNTOS = `Analise o documento PDF fornecido e mapeie os principais ASSUNTOS (tópicos de estudo) nele contidos, na ordem em que aparecem.

Regras:
- Cada assunto deve ser um tópico cobrável em prova (ex: "Sanções Disciplinares", "Recursos", "Prazos", "Competências").
- Entre 4 e 15 assuntos, dependendo do tamanho do documento.
- A descrição resume em 1 frase o que o assunto cobre no documento.`;

export function promptGerarFlashcards(assuntos: string[]): string {
  return `Com base no documento PDF fornecido, gere flashcards de memorização (frente/verso) para os seguintes assuntos: ${assuntos.join(', ')}.

Regras:
- 4 a 8 cards por assunto, cobrindo os pontos mais prováveis de cair em prova FUNDATEC (prazos, autoridades, competências, sanções, exceções).
- FRENTE: uma pergunta curta e direta OU um conceito a completar.
- VERSO: a resposta literal conforme o texto do documento, citando o artigo/dispositivo quando existir.
- O campo "assunto" de cada card deve ser exatamente um dos assuntos listados acima.`;
}

export function promptGerarQA(assuntos: string[]): string {
  return `Com base no documento PDF fornecido, gere blocos de perguntas e respostas para os seguintes assuntos: ${assuntos.join(', ')}.

Para CADA assunto, gere 3 a 6 blocos. Cada bloco cobre UM ponto específico do texto e contém EXATAMENTE 3 variações de pergunta sobre esse mesmo ponto:
- Variação 1: cobra a REGRA GERAL / CONCEITO.
- Variação 2: cobra a EXCEÇÃO ou o REQUISITO.
- Variação 3: cobra o PRAZO, a COMPETÊNCIA ou a AUTORIDADE envolvida.

Se o ponto não tiver exceção ou prazo, a variação correspondente muda o ângulo da cobrança (ex: reformula como "assinale a incorreta" mental, ou cobra outro detalhe literal do mesmo dispositivo).

As respostas devem ser literais ao texto, citando artigo/dispositivo quando existir.
O campo "assunto" da resposta deve ser exatamente o nome do assunto tratado.`;
}

export function promptReformularCard(frente: string, verso: string): string {
  return `Reformule o flashcard abaixo. Gere UM novo card sobre O MESMO ponto do conteúdo, mas mudando o foco ou o ângulo da cobrança (ex: se perguntava o prazo, pergunte a autoridade; se era pergunta direta, vire "complete a frase").

Card atual:
FRENTE: ${frente}
VERSO: ${verso}

Mantenha a literalidade da informação do verso — não invente dados novos que não estejam implícitos no card atual.`;
}

export function promptReformularQA(variacoes: { pergunta: string; resposta: string }[]): string {
  const lista = variacoes
    .map((v, i) => `Variação ${i + 1}:\nPergunta: ${v.pergunta}\nResposta: ${v.resposta}`)
    .join('\n\n');
  return `O bloco de estudo abaixo já tem as seguintes variações de pergunta sobre o mesmo ponto:

${lista}

Gere UMA NOVA variação (pergunta + resposta) sobre esse MESMO ponto, com um ângulo de cobrança DIFERENTE de todas as variações acima. Estilo FUNDATEC: literal, direto, focado em detalhe (prazo, autoridade, exceção, palavra-chave). Não invente informações que não estejam nas respostas acima.`;
}

export function promptGerarSimulado(assuntosComMaterial: string, qtd: number): string {
  return `Gere ${qtd} questões de múltipla escolha ESTILO FUNDATEC com base EXCLUSIVAMENTE no material de estudo abaixo (extraído do documento original).

MATERIAL DE ESTUDO:
${assuntosComMaterial}

Regras FUNDATEC obrigatórias:
- 5 alternativas (A, B, C, D, E), apenas UMA correta.
- Enunciado curto e direto.
- Distratores com PEQUENAS alterações do texto correto (troca de prazo, autoridade, palavra).
- Alternativas com estrutura e tamanho parecidos.
- A justificativa aponta o detalhe literal que valida o gabarito e o que invalida os distratores.
- Distribua as questões entre os assuntos do material.
- Varie a letra do gabarito entre as questões.`;
}

export function promptAvaliarSimulado(
  questoes: {
    ordem: number;
    enunciado: string;
    gabarito: string;
    respostaUsuario: string | null;
    justificativa: string;
  }[]
): string {
  const lista = questoes
    .map(
      (q) =>
        `Questão ${q.ordem}: ${q.enunciado}\nGabarito: ${q.gabarito} | Resposta do aluno: ${q.respostaUsuario ?? 'em branco'}\nJustificativa oficial: ${q.justificativa}`
    )
    .join('\n\n');
  return `Você é um professor corrigindo um simulado FUNDATEC. Para cada questão abaixo, escreva um feedback curto (2-3 frases) e incentivador para o aluno: se acertou, reforce o ponto-chave; se errou, aponte exatamente o detalhe que o pegou e como não cair de novo.

${lista}`;
}

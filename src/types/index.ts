// Tipos compartilhados entre frontend e API routes

export interface AssuntoMapeado {
  nome: string;
  descricao: string;
}

export interface CardDTO {
  id: string;
  assuntoNome: string | null;
  frente: string;
  verso: string;
}

export interface VariacaoDTO {
  id: string;
  versao: number;
  pergunta: string;
  resposta: string;
}

export interface BlocoDTO {
  id: string;
  idBloco: number;
  assuntoNome: string;
  variacoes: VariacaoDTO[];
}

export interface ConteudoResumo {
  id: string;
  titulo: string;
  descricao: string | null;
  pdfUrl: string | null;
  numPaginas: number | null;
  createdAt: string;
  _count: { cards: number; assuntos: number; simulados: number };
  assuntos: { id: string; nome: string }[];
}

export interface TopicoResumo {
  titulo: string;
  pontos: string[];
}

export interface ResumoDTO {
  id: string;
  conteudoId: string;
  conteudoTitulo?: string;
  titulo: string;
  introducao: string;
  topicos: TopicoResumo[];
  palavrasChave: string[];
  createdAt: string;
  updatedAt: string;
}

export type Alternativas = { A: string; B: string; C: string; D: string; E: string };

export interface QuestaoDTO {
  id: string;
  ordem: number;
  enunciado: string;
  alternativas: Alternativas;
  // presentes apenas quando o simulado está finalizado (modo leitura)
  gabarito?: string;
  justificativa?: string;
  respostaUsuario?: string | null;
  correta?: boolean | null;
  feedbackIA?: string | null;
}

export interface SimuladoDTO {
  id: string;
  titulo: string;
  conteudoId: string;
  conteudoTitulo?: string;
  assuntos: string[];
  qtdQuestoes: number;
  tempoLimite: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
  status: 'em_andamento' | 'finalizado';
  nota: number | null;
  acertos: number | null;
  total: number | null;
  iniciadoEm: string;
  finalizadoEm: string | null;
  questoes: QuestaoDTO[];
}

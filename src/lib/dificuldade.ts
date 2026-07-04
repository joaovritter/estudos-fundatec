// Níveis de dificuldade do simulado — fonte única de verdade (rótulos,
// descrições e estilos), usada tanto no backend quanto no frontend.

export type Nivel = 'facil' | 'medio' | 'dificil';

export const NIVEIS: Nivel[] = ['facil', 'medio', 'dificil'];

export function ehNivel(v: unknown): v is Nivel {
  return v === 'facil' || v === 'medio' || v === 'dificil';
}

interface InfoNivel {
  valor: Nivel;
  rotulo: string;
  descricao: string;
  /** classes Tailwind para o selo/badge */
  badge: string;
}

export const INFO_NIVEL: Record<Nivel, InfoNivel> = {
  facil: {
    valor: 'facil',
    rotulo: 'Fácil',
    descricao: 'Conceitos diretos e literais, para fixar a base.',
    badge: 'bg-salvia-100 text-salvia-700 border-salvia-500/30',
  },
  medio: {
    valor: 'medio',
    rotulo: 'Médio',
    descricao: 'Estilo padrão da banca, com distratores por pequenas trocas.',
    badge: 'bg-ambar-200/50 text-ambar-700 border-ambar-400/40',
  },
  dificil: {
    valor: 'dificil',
    rotulo: 'Difícil',
    descricao: 'Pegadinhas máximas: exceções, prazos e palavras trocadas.',
    badge: 'bg-erro/10 text-erro border-erro/30',
  },
};

// Instrução de calibragem injetada no prompt de geração do simulado.
export function calibragemPrompt(nivel: Nivel): string {
  switch (nivel) {
    case 'facil':
      return `NÍVEL DE DIFICULDADE: FÁCIL.
- Cobre conceitos diretos, definições e a regra geral literal do texto.
- Os distratores devem ser claramente distinguíveis do gabarito (erros evidentes para quem estudou).
- Evite pegadinhas, exceções obscuras ou cruzamento de dispositivos.
- Enunciados objetivos, sem inversões que confundam.`;
    case 'dificil':
      return `NÍVEL DE DIFICULDADE: DIFÍCIL.
- Explore ao máximo as pegadinhas típicas da FUNDATEC: exceções, prazos exatos, autoridades competentes e trocas sutis de palavras ("poderá" vs "deverá", "até" vs "após").
- Os distratores devem ser MUITO próximos do gabarito, com uma única alteração pontual difícil de perceber.
- Prefira cobrar exceções e requisitos em vez da regra geral, e cruzamento entre dispositivos quando o material permitir.
- Enunciados podem exigir atenção redobrada à literalidade.`;
    case 'medio':
    default:
      return `NÍVEL DE DIFICULDADE: MÉDIO.
- Estilo padrão FUNDATEC: mescle regra geral, requisitos e exceções.
- Distratores com pequenas alterações do texto correto (troca de prazo, autoridade ou palavra), no nível usual de prova.`;
  }
}

import { GoogleGenAI, Type, type Schema } from '@google/genai';
import { get } from '@vercel/blob';
import { SYSTEM_FUNDATEC } from '@/lib/prompts';

// Cascata de modelos free: cada um tem cota diária própria. Ao esgotar (429),
// tentamos o próximo — multiplicando a cota total disponível. Todos leem PDF e
// suportam responseSchema. Os 2.0 não aceitam thinkingConfig (tratado abaixo).
const MODELOS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

let _ai: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY não configurada');
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

// ---------- responseSchemas por ação ----------

export const schemaMapearAssuntos: Schema = {
  type: Type.OBJECT,
  properties: {
    assuntos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          nome: { type: Type.STRING },
          descricao: { type: Type.STRING },
        },
        required: ['nome', 'descricao'],
      },
    },
  },
  required: ['assuntos'],
};

export const schemaGerarCards: Schema = {
  type: Type.OBJECT,
  properties: {
    cards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          assunto: { type: Type.STRING },
          frente: { type: Type.STRING },
          verso: { type: Type.STRING },
        },
        required: ['assunto', 'frente', 'verso'],
      },
    },
  },
  required: ['cards'],
};

export const schemaGerarQA: Schema = {
  type: Type.OBJECT,
  properties: {
    blocos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          assunto: { type: Type.STRING },
          id_bloco: { type: Type.INTEGER },
          variacoes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                versao: { type: Type.INTEGER },
                pergunta: { type: Type.STRING },
                resposta: { type: Type.STRING },
              },
              required: ['versao', 'pergunta', 'resposta'],
            },
          },
        },
        required: ['assunto', 'id_bloco', 'variacoes'],
      },
    },
  },
  required: ['blocos'],
};

export const schemaReformularCard: Schema = {
  type: Type.OBJECT,
  properties: {
    frente: { type: Type.STRING },
    verso: { type: Type.STRING },
  },
  required: ['frente', 'verso'],
};

export const schemaReformularQA: Schema = {
  type: Type.OBJECT,
  properties: {
    pergunta: { type: Type.STRING },
    resposta: { type: Type.STRING },
  },
  required: ['pergunta', 'resposta'],
};

export const schemaResumo: Schema = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING },
    introducao: { type: Type.STRING },
    topicos: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          titulo: { type: Type.STRING },
          pontos: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['titulo', 'pontos'],
      },
    },
    palavrasChave: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['titulo', 'introducao', 'topicos', 'palavrasChave'],
};

export const schemaSimulado: Schema = {
  type: Type.OBJECT,
  properties: {
    questoes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          enunciado: { type: Type.STRING },
          alternativas: {
            type: Type.OBJECT,
            properties: {
              A: { type: Type.STRING },
              B: { type: Type.STRING },
              C: { type: Type.STRING },
              D: { type: Type.STRING },
              E: { type: Type.STRING },
            },
            required: ['A', 'B', 'C', 'D', 'E'],
          },
          gabarito: { type: Type.STRING },
          justificativa: { type: Type.STRING },
        },
        required: ['enunciado', 'alternativas', 'gabarito', 'justificativa'],
      },
    },
  },
  required: ['questoes'],
};

export const schemaAvaliar: Schema = {
  type: Type.OBJECT,
  properties: {
    feedbacks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ordem: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
        },
        required: ['ordem', 'feedback'],
      },
    },
  },
  required: ['feedbacks'],
};

// ---------- chamada genérica ----------

/** Remove cercas ```json ... ``` caso o modelo as inclua mesmo com responseSchema. */
function parseJsonSeguro<T>(texto: string): T {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  return JSON.parse(limpo) as T;
}

interface ChamadaIA {
  prompt: string;
  schema: Schema;
  /** PDF em base64 — enviado como documento nativo ao Gemini (lê texto e escaneado). */
  pdfBase64?: string;
  /** pathname do PDF no Blob privado — o servidor lê via get() e converte p/ base64. */
  pdfPathname?: string;
  /**
   * Orçamento de "thinking" do 2.5-flash. Default 0 = desligado, muito mais
   * rápido para extração estruturada. Tarefas que se beneficiam de raciocínio
   * (elaborar questões de simulado) podem passar um valor maior.
   */
  thinkingBudget?: number;
}

/** Lê um PDF privado do Blob (por pathname) e devolve em base64. */
export async function pdfPathnameParaBase64(pathname: string): Promise<string> {
  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200) {
    throw new Error('PDF não encontrado no Blob');
  }
  const buf = Buffer.from(await new Response(result.stream).arrayBuffer());
  return buf.toString('base64');
}

/** Erro de autenticação da IA — chave ausente, inválida ou expirada. */
export class ErroAuthIA extends Error {
  constructor() {
    super('Chave da IA inválida ou expirada');
    this.name = 'ErroAuthIA';
  }
}

function ehErroAuth(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /401|UNAUTHENTICATED|API key|invalid authentication|permission denied|API_KEY_INVALID/i.test(msg);
}

function ehErroQuota(e: unknown): boolean {
  const s = (e as { status?: number })?.status;
  const msg = e instanceof Error ? e.message : String(e);
  return s === 429 || /RESOURCE_EXHAUSTED|exceeded your current quota|quota|rate.?limit/i.test(msg);
}

/** Converte um erro de chamada à IA numa mensagem+status prontos para a API route. */
export function mensagemErroIA(e: unknown, fallback: string): { error: string; status: number } {
  if (e instanceof ErroAuthIA) {
    return {
      error:
        'A chave da IA (GEMINI_API_KEY) está inválida ou expirada. Gere uma nova em aistudio.google.com/apikey e atualize nas variáveis de ambiente.',
      status: 502,
    };
  }
  if (ehErroQuota(e)) {
    return {
      error:
        'Limite de uso diário da IA atingido — todos os modelos grátis do Gemini esgotaram a cota de hoje. Aguarde a cota renovar (por volta das 4h da manhã, horário de Brasília) ou ative o faturamento da API do Gemini para aumentar o limite.',
      status: 429,
    };
  }
  return { error: fallback, status: 500 };
}

export async function gerarJSON<T>({ prompt, schema, pdfBase64, pdfPathname, thinkingBudget = 0 }: ChamadaIA): Promise<T> {
  const parts: any[] = [];
  const base64 = pdfBase64 ?? (pdfPathname ? await pdfPathnameParaBase64(pdfPathname) : undefined);
  if (base64) {
    parts.push({ inlineData: { mimeType: 'application/pdf', data: base64 } });
  }
  parts.push({ text: prompt });

  // Percorre a cascata de modelos: no 429 (cota), troca imediatamente para o
  // próximo modelo (que tem cota própria). Só falha quando TODOS esgotam.
  let ultimoErroQuota: unknown = null;
  for (let i = 0; i < MODELOS.length; i++) {
    const model = MODELOS[i];
    const config: Record<string, unknown> = {
      systemInstruction: SYSTEM_FUNDATEC,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.4,
    };
    // thinkingConfig só existe nos modelos 2.5.
    if (model.startsWith('gemini-2.5')) config.thinkingConfig = { thinkingBudget };

    try {
      const res = await ai().models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config,
      });
      const texto = res.text;
      if (!texto) throw new Error('Resposta vazia da IA');
      return parseJsonSeguro<T>(texto);
    } catch (e) {
      if (ehErroAuth(e)) throw new ErroAuthIA();
      if (ehErroQuota(e)) {
        ultimoErroQuota = e;
        continue; // tenta o próximo modelo da cascata
      }
      throw e;
    }
  }

  // Todos os modelos esgotaram a cota — propaga como erro de quota.
  throw ultimoErroQuota ?? new Error('Falha na geração');
}

import { GoogleGenAI, Type, type Schema } from '@google/genai';
import { SYSTEM_FUNDATEC } from '@/lib/prompts';

const MODEL = 'gemini-2.5-flash';

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
  /** URL do PDF (Vercel Blob) — o servidor baixa e converte para base64. */
  pdfUrl?: string;
  /**
   * Orçamento de "thinking" do 2.5-flash. Default 0 = desligado, muito mais
   * rápido para extração estruturada. Tarefas que se beneficiam de raciocínio
   * (elaborar questões de simulado) podem passar um valor maior.
   */
  thinkingBudget?: number;
}

/** Baixa um PDF de uma URL (Blob) e devolve em base64. */
export async function pdfUrlParaBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar o PDF (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
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

/** Converte um erro de chamada à IA numa mensagem+status prontos para a API route. */
export function mensagemErroIA(e: unknown, fallback: string): { error: string; status: number } {
  if (e instanceof ErroAuthIA) {
    return {
      error:
        'A chave da IA (GEMINI_API_KEY) está inválida ou expirada. Gere uma nova em aistudio.google.com/apikey e atualize nas variáveis de ambiente.',
      status: 502,
    };
  }
  return { error: fallback, status: 500 };
}

export async function gerarJSON<T>({ prompt, schema, pdfBase64, pdfUrl, thinkingBudget = 0 }: ChamadaIA): Promise<T> {
  const parts: any[] = [];
  const base64 = pdfBase64 ?? (pdfUrl ? await pdfUrlParaBase64(pdfUrl) : undefined);
  if (base64) {
    parts.push({ inlineData: { mimeType: 'application/pdf', data: base64 } });
  }
  parts.push({ text: prompt });

  let res;
  try {
    res = await ai().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: SYSTEM_FUNDATEC,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.4,
        thinkingConfig: { thinkingBudget },
      },
    });
  } catch (e) {
    if (ehErroAuth(e)) throw new ErroAuthIA();
    throw e;
  }

  const texto = res.text;
  if (!texto) throw new Error('Resposta vazia da IA');
  return parseJsonSeguro<T>(texto);
}

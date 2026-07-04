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
}

export async function gerarJSON<T>({ prompt, schema, pdfBase64 }: ChamadaIA): Promise<T> {
  const parts: any[] = [];
  if (pdfBase64) {
    parts.push({ inlineData: { mimeType: 'application/pdf', data: pdfBase64 } });
  }
  parts.push({ text: prompt });

  const res = await ai().models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: SYSTEM_FUNDATEC,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.4,
    },
  });

  const texto = res.text;
  if (!texto) throw new Error('Resposta vazia da IA');
  return parseJsonSeguro<T>(texto);
}

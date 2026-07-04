# 📚 Motor de Inteligência de Estudos — FUNDATEC

Aplicação web de estudos para concursos públicos (foco banca **FUNDATEC**). Você envia PDFs de legislação/apostilas e a IA (Gemini) gera:

- 🃏 **Flashcards** (frente/verso) com animação de virada
- 💬 **Perguntas & Respostas variadas** — 3 variações por bloco (regra geral, exceção, prazo/autoridade), com reformulação sob demanda
- 📝 **Simulados estilo FUNDATEC** — 5 alternativas, cronômetro regressivo, correção automática e justificativa por questão
- 📖 **Histórico de simulados** em modo leitura, com avaliação detalhada opcional da IA

**Princípio de economia:** tudo que a IA gera é persistido no Postgres. A API do Gemini só é chamada para gerar conteúdo novo, reformular, criar simulado e (opcionalmente) avaliar. A correção do simulado é local, comparando com o gabarito salvo.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Banco | Vercel Postgres (Neon) + Prisma |
| Auth | Auth.js (NextAuth v5) — credentials + bcrypt, sessão JWT |
| IA | Gemini API (`@google/genai`), modelo `gemini-2.5-flash`, leitura nativa de PDF + `responseSchema` |
| UI | Tailwind CSS (paleta creme/âmbar/sálvia) + Framer Motion |

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npx prisma migrate deploy    # aplica as migrations no banco
npm run dev
```

Variáveis necessárias (`.env.local`):

- `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` — banco Postgres (via `vercel env pull .env.local` se já conectou o Storage)
- `GEMINI_API_KEY` — chave da API do Gemini ([Google AI Studio](https://aistudio.google.com/apikey))
- `AUTH_SECRET` — gere com `npx auth secret`
- `NEXTAUTH_URL` — `http://localhost:3000` no dev

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. **Storage → Create Database → Postgres** e conecte ao projeto (injeta `POSTGRES_*` automaticamente).
3. Em **Settings → Environment Variables**, adicione `GEMINI_API_KEY` e `AUTH_SECRET`.
4. Deploy — o script de build roda `prisma generate && prisma migrate deploy && next build`, aplicando as migrations automaticamente.

Notas:
- As rotas que chamam a IA têm `maxDuration = 60`; confirme que o plano permite (Hobby permite até 60s com Fluid Compute).
- Upload de PDF limitado a ~4MB (limite de request body da Vercel é 4.5MB). Para PDFs maiores, dividir o arquivo — ou evoluir para a Gemini File API (ver seção Extensibilidade).

## Estrutura

```
src/
├── app/(auth)/           # login e registro (públicas)
├── app/(app)/            # rotas protegidas: conteudos, simulados, historico
├── app/api/              # API routes (auth, conteudos, ia/*, cards, qa, simulados)
├── components/           # ConfirmDialog, Flashcard, Cronometro, QuestaoSimulado, Nav, ui/
├── lib/
│   ├── prisma.ts         # singleton PrismaClient
│   ├── auth.ts           # Auth.js (credentials + bcrypt)
│   ├── gemini.ts         # cliente Gemini + responseSchemas por ação
│   └── prompts.ts        # persona FUNDATEC (5 leis da banca) + prompts por ação
└── types/                # DTOs compartilhados
```

## Extensibilidade

- **Novos conteúdos sem mudar código:** qualquer PDF entra pelo fluxo genérico (upload → mapear assuntos → confirmar → gerar).
- **Outra banca:** os prompts estão centralizados em `src/lib/prompts.ts` — basta criar outro system prompt.
- **PDFs grandes:** trocar o envio base64 inline pela Gemini File API em `src/lib/gemini.ts`.
- **SRS (spaced repetition):** fora do escopo v1; o modelo `Card` está pronto para receber campos de agendamento.

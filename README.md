# 📚 Motor de Inteligência de Estudos — FUNDATEC

> Estude para concursos públicos com material gerado por IA a partir dos **seus próprios PDFs** de legislação — no estilo exato da banca FUNDATEC.

**🌐 Aplicação no ar:** [estudos-fundatec.vercel.app](https://estudos-fundatec.vercel.app)

---

## 💡 O que é isso?

Você faz upload de um PDF (uma lei, um estatuto, uma apostila) e a IA transforma o documento em material de estudo pronto:

| Módulo | O que faz |
|---|---|
| 🃏 **Flashcards** | Cards de memorização frente/verso com animação de virada. Reformule, edite ou delete qualquer card. |
| 💬 **Perguntas & Respostas** | Cada ponto do conteúdo vira um bloco com **3 variações de pergunta** (regra geral → exceção → prazo/autoridade). Esgotou as variações? A IA gera mais uma na hora. |
| 📝 **Simulados FUNDATEC** | Questões de múltipla escolha com 5 alternativas, cronômetro regressivo, correção instantânea com justificativa por questão e nota final. |
| 📖 **Histórico** | Todos os simulados finalizados ficam disponíveis em modo leitura — questões, gabarito, suas respostas e justificativas. |
| 🎓 **Professor IA** | Depois de finalizar um simulado, peça uma avaliação detalhada: a IA comenta questão por questão o que te derrubou e como não cair de novo. |

## 🏦 O estilo FUNDATEC embutido

A persona da IA conhece as **5 leis da banca** e as aplica em tudo que gera:

1. **Literalidade** — cobra o texto exato da lei;
2. **Pequenas alterações** — distratores trocam um prazo, uma autoridade, um "poderá" por "deverá";
3. **Enunciados curtos** — direto ao ponto, sem historinha;
4. **Alternativas parecidas** — mesma estrutura e tamanho, forçando leitura atenta;
5. **Foco temático** — prazos, competências, autoridades, sanções e exceções.

E uma regra de segurança absoluta: a IA **só usa o conteúdo do seu PDF** — nunca inventa artigos ou dispositivos.

## 💰 Princípio de economia

**Tudo que a IA gera é persistido no banco.** A API do Gemini só é chamada em 4 momentos:

1. Processar um PDF novo (mapear assuntos + gerar material);
2. Reformular (gerar uma variação/versão adicional);
3. Criar um simulado;
4. Avaliação detalhada opcional (e o resultado também fica salvo).

Estudar, revisar, refazer, navegar — **tudo isso lê do banco, custo zero**. A correção do simulado compara suas respostas com o gabarito salvo, sem IA.

## 🔄 Como funciona (fluxo)

```
┌────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│ Upload PDF │ →  │ IA mapeia os    │ →  │ Você revisa e    │ →  │ IA gera     │
│  (até 4MB) │    │ assuntos        │    │ ajusta a lista   │    │ Cards + Q&A │
└────────────┘    └─────────────────┘    └──────────────────┘    └──────┬──────┘
                                                                        │ salvo no banco
                  ┌─────────────────────────────────────────────────────┘
                  ▼
   ┌──────────────────────────────────────────────────┐
   │  Estudar: Flashcards · Q&A · Simulados · Histórico │
   └──────────────────────────────────────────────────┘
```

## 🛠 Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Frontend + API routes no mesmo projeto, deploy nativo na Vercel |
| Banco | **Postgres (Neon)** + **Prisma** | Serverless-friendly, migrations versionadas, type-safety |
| Auth | **Auth.js v5** (credentials + bcrypt) | Login multi-usuário simples, sessão JWT |
| IA | **Gemini 2.5 Flash** (`@google/genai`) | Lê PDF nativamente (texto e escaneado), `responseSchema` garante JSON estruturado |
| UI | **Tailwind CSS** + **Framer Motion** | Paleta aconchegante (creme/âmbar/sálvia) e animações sutis |

## 📁 Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/               # login e registro (rotas públicas)
│   ├── (app)/                # rotas protegidas
│   │   ├── conteudos/        # lista + wizard de upload
│   │   │   └── [id]/cards    # modo flashcard
│   │   │   └── [id]/qa       # perguntas & respostas
│   │   └── simulados/        # criar, executar (cronômetro) e histórico
│   └── api/
│       ├── auth/ · registro/ # autenticação
│       ├── conteudos/        # CRUD de conteúdos
│       ├── ia/               # mapear-assuntos, gerar-cards, gerar-qa, reformular
│       ├── cards/ · qa/      # CRUD de cards e leitura de variações
│       └── simulados/        # criar, finalizar (correção local), avaliar (IA)
├── components/               # Flashcard, Cronometro, QuestaoSimulado, ConfirmDialog…
├── lib/
│   ├── prisma.ts             # singleton do PrismaClient
│   ├── auth.ts               # Auth.js (split config edge-safe p/ middleware)
│   ├── gemini.ts             # cliente + responseSchemas de cada ação
│   └── prompts.ts            # ⭐ persona FUNDATEC + todos os prompts (1 arquivo)
└── middleware.ts             # proteção de rotas
```

## 🚀 Rodando localmente

```bash
git clone https://github.com/joaovritter/estudos-fundatec.git
cd estudos-fundatec
npm install
cp .env.example .env.local    # preencha as variáveis (abaixo)
npx prisma migrate deploy     # cria as tabelas no seu Postgres
npm run dev                   # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Onde conseguir |
|---|---|
| `POSTGRES_PRISMA_URL` | Connection string do Postgres (pooled). Com Vercel + Neon: `vercel env pull .env.local` |
| `POSTGRES_URL_NON_POOLING` | Connection string direta (para migrations) |
| `GEMINI_API_KEY` | Grátis no [Google AI Studio](https://aistudio.google.com/apikey) |
| `AUTH_SECRET` | Gere com `npx auth secret` ou `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` no dev (na Vercel não é necessário) |

## ☁️ Deploy na Vercel

1. **Importe** o repositório em [vercel.com/new](https://vercel.com/new), adicionando `GEMINI_API_KEY` e `AUTH_SECRET` nas Environment Variables;
2. **Storage → Create Database → Neon (Postgres)** e conecte ao projeto (injeta as variáveis do banco automaticamente);
3. **Redeploy** — o build roda `prisma migrate deploy` sozinho e aplica as migrations.

> As rotas de IA usam `maxDuration = 60` e os simulados são gerados em lotes de 5 questões para nunca estourar o tempo da função.

## 🧭 Guia rápido de uso

1. **Crie sua conta** em `/registro`;
2. **Adicione um conteúdo**: upload do PDF → confira os assuntos que a IA detectou (remova o que não interessa) → escolha Cards, Q&A ou ambos → aguarde a geração (~1 min);
3. **Flashcards**: toque no card para virar; use ✨ Reformular para a IA reescrever o card com outro ângulo;
4. **Q&A**: selecione os assuntos → responda mentalmente → 👁 Revelar resposta → 🔄 Reformular traz a próxima variação (ou gera uma nova);
5. **Simulado**: escolha conteúdo, assuntos, nº de questões e tempo (sugestão automática de 3 min/questão) → faça a prova → nota na hora → 🎓 peça o parecer do professor IA;
6. **Histórico**: revise qualquer simulado finalizado com gabarito e justificativas.

## ⚠️ Limites conhecidos

- **PDF até ~4MB** por upload (limite de request da Vercel). Arquivos maiores: divida em partes — cada parte vira um conteúdo;
- A geração por IA leva de 20s a 60s dependendo do tamanho do PDF — as telas mostram o progresso;
- O simulado usa como fonte o material já gerado (Q&A/cards) dos assuntos escolhidos — gere o material antes de criar simulados.

## 🗺 Roadmap (ideias futuras)

- [ ] Suporte a PDFs grandes via Gemini File API;
- [ ] Outras bancas (CESPE, FCC…) — basta um novo system prompt em `lib/prompts.ts`, selecionável por conteúdo;
- [ ] Spaced repetition (SRS) nos flashcards;
- [ ] Estatísticas de desempenho por assunto ao longo do tempo.

---

Feito com ☕ e Next.js para a sua aprovação. Bons estudos! 🍀

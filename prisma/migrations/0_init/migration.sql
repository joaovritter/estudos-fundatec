-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conteudo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conteudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assunto" (
    "id" TEXT NOT NULL,
    "conteudoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "conteudoId" TEXT NOT NULL,
    "assuntoNome" TEXT,
    "frente" TEXT NOT NULL,
    "verso" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlocoQA" (
    "id" TEXT NOT NULL,
    "assuntoId" TEXT NOT NULL,
    "idBloco" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlocoQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariacaoQA" (
    "id" TEXT NOT NULL,
    "blocoId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "pergunta" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariacaoQA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulado" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conteudoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "assuntos" TEXT[],
    "qtdQuestoes" INTEGER NOT NULL,
    "tempoLimite" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "nota" DOUBLE PRECISION,
    "acertos" INTEGER,
    "total" INTEGER,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "Simulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimuladoQuestao" (
    "id" TEXT NOT NULL,
    "simuladoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "alternativas" JSONB NOT NULL,
    "gabarito" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "respostaUsuario" TEXT,
    "correta" BOOLEAN,
    "feedbackIA" TEXT,

    CONSTRAINT "SimuladoQuestao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Conteudo" ADD CONSTRAINT "Conteudo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assunto" ADD CONSTRAINT "Assunto_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlocoQA" ADD CONSTRAINT "BlocoQA_assuntoId_fkey" FOREIGN KEY ("assuntoId") REFERENCES "Assunto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariacaoQA" ADD CONSTRAINT "VariacaoQA_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "BlocoQA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulado" ADD CONSTRAINT "Simulado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulado" ADD CONSTRAINT "Simulado_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoQuestao" ADD CONSTRAINT "SimuladoQuestao_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable: resumo de estudo por conteúdo
CREATE TABLE "Resumo" (
    "id" TEXT NOT NULL,
    "conteudoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "introducao" TEXT NOT NULL,
    "topicos" JSONB NOT NULL,
    "palavrasChave" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resumo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Resumo_conteudoId_key" ON "Resumo"("conteudoId");

ALTER TABLE "Resumo" ADD CONSTRAINT "Resumo_conteudoId_fkey" FOREIGN KEY ("conteudoId") REFERENCES "Conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

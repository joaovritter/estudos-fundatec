-- AlterTable: guarda o PDF original (Vercel Blob) e o total de páginas
ALTER TABLE "Conteudo" ADD COLUMN "pdfUrl" TEXT;
ALTER TABLE "Conteudo" ADD COLUMN "numPaginas" INTEGER;

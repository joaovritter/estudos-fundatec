-- AlterTable: adiciona nível de dificuldade aos simulados (default preserva dados existentes)
ALTER TABLE "Simulado" ADD COLUMN "dificuldade" TEXT NOT NULL DEFAULT 'medio';

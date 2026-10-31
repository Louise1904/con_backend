/*
  Warnings:

  - A unique constraint covering the columns `[alunoId,disciplinaId,data]` on the table `chamadas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "chamadas_alunoId_data_key";

-- AlterTable
ALTER TABLE "chamadas" ADD COLUMN     "disciplinaId" INTEGER;

-- CreateTable
CREATE TABLE "disciplinas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cargaHoraria" VARCHAR(20),
    "professorNome" VARCHAR(100),
    "sala" VARCHAR(50),
    "capacidade" INTEGER,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chamadas_alunoId_disciplinaId_data_key" ON "chamadas"("alunoId", "disciplinaId", "data");

-- AddForeignKey
ALTER TABLE "chamadas" ADD CONSTRAINT "chamadas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

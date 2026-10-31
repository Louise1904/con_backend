/*
  Warnings:

  - You are about to drop the column `capacidade` on the `disciplinas` table. All the data in the column will be lost.
  - You are about to drop the column `sala` on the `disciplinas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matricula]` on the table `alunos` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "alunos" ADD COLUMN     "matricula" VARCHAR(20);

-- AlterTable
ALTER TABLE "disciplinas" DROP COLUMN "capacidade",
DROP COLUMN "sala";

-- CreateIndex
CREATE UNIQUE INDEX "alunos_matricula_key" ON "alunos"("matricula");

-- 1. Coluna ainda opcional, pra não quebrar as linhas existentes
ALTER TABLE "turmas_professores" ADD COLUMN "disciplinaId" INTEGER;

-- 2. Preenche cruzando pelo nome do professor
UPDATE "turmas_professores" tp
SET "disciplinaId" = d.id
FROM "funcionarios" f, "disciplinas" d
WHERE tp."funcionarioId" = f.id
  AND d."professorNome" = f.nome;

-- 3. Agora sim trava como obrigatória
ALTER TABLE "turmas_professores" ALTER COLUMN "disciplinaId" SET NOT NULL;

-- 4. Troca a constraint de única
DROP INDEX "turmas_professores_turmaId_funcionarioId_key";
CREATE UNIQUE INDEX "turmas_professores_turmaId_disciplinaId_key" ON "turmas_professores"("turmaId", "disciplinaId");

-- 5. Chave estrangeira
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_disciplinaId_fkey"
  FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Remove o texto livre, substituído pelo vínculo de verdade
ALTER TABLE "disciplinas" DROP COLUMN "professorNome";
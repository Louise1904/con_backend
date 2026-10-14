-- CreateTable
CREATE TABLE "admins" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "sexo" VARCHAR(20) NOT NULL,
    "nome_responsavel" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "endereco" VARCHAR(150) NOT NULL,
    "numero" VARCHAR(10) NOT NULL,
    "complemento" VARCHAR(50),
    "bairro" VARCHAR(50) NOT NULL,
    "cidade" VARCHAR(50) NOT NULL,
    "cep" VARCHAR(10) NOT NULL,
    "turmaId" INTEGER NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "matricula" VARCHAR(20) NOT NULL,
    "cargo" VARCHAR(50) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "endereco" VARCHAR(150) NOT NULL,
    "numero" VARCHAR(10) NOT NULL,
    "complemento" VARCHAR(50),
    "bairro" VARCHAR(50) NOT NULL,
    "cidade" VARCHAR(50) NOT NULL,
    "cep" VARCHAR(10) NOT NULL,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "ano_letivo" INTEGER NOT NULL,
    "turno" VARCHAR(20) NOT NULL,
    "salaId" INTEGER NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "andar" INTEGER,
    "bloco" VARCHAR(30),
    "tipo" VARCHAR(30) NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "salas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salas_professores" (
    "id" SERIAL NOT NULL,
    "salaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,

    CONSTRAINT "salas_professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas_professores" (
    "id" SERIAL NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,

    CONSTRAINT "turmas_professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamadas" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "presente" BOOLEAN NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "funcionarioId" INTEGER NOT NULL,
    "turmaProfessorId" INTEGER NOT NULL,

    CONSTRAINT "chamadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_cpf_key" ON "funcionarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_matricula_key" ON "funcionarios"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "salas_numero_key" ON "salas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "salas_professores_salaId_funcionarioId_key" ON "salas_professores"("salaId", "funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_professores_turmaId_funcionarioId_key" ON "turmas_professores"("turmaId", "funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "chamadas_alunoId_data_key" ON "chamadas"("alunoId", "data");

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "salas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salas_professores" ADD CONSTRAINT "salas_professores_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "salas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salas_professores" ADD CONSTRAINT "salas_professores_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas_professores" ADD CONSTRAINT "turmas_professores_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas" ADD CONSTRAINT "chamadas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas" ADD CONSTRAINT "chamadas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas" ADD CONSTRAINT "chamadas_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamadas" ADD CONSTRAINT "chamadas_turmaProfessorId_fkey" FOREIGN KEY ("turmaProfessorId") REFERENCES "turmas_professores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

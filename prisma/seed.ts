import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL nao encontrada no ambiente.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function toDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hashSenha(senha: string): string {
  return bcrypt.hashSync(senha, 12);
}

function pick<T>(lista: readonly T[]): T {
  return lista[randomInt(0, lista.length - 1)];
}

const TURNOS = ["Manha", "Tarde"] as const;
const SEXOS = ["Feminino", "Masculino"] as const;

const admins: Prisma.AdminCreateManyInput[] = [
  {
    nome: "Direcao Geral",
    email: "direcao@con.local",
    senha: hashSenha("Admin@123"),
  },
];

const funcionarios: Prisma.FuncionarioCreateManyInput[] = [
  {
    nome: "Ana Souza",
    cpf: "111.111.111-11",
    matricula: "PROF-001",
    cargo: "Professor",
    telefone: "(11) 99999-0001",
    email: "ana.souza@con.local",
    senha: hashSenha("Professor@123"),
    endereco: "Rua das Flores",
    numero: "120",
    complemento: "Casa",
    bairro: "Centro",
    cidade: "Sao Paulo",
    cep: "01000-000",
  },
  {
    nome: "Bruno Lima",
    cpf: "222.222.222-22",
    matricula: "PROF-002",
    cargo: "Professor",
    telefone: "(11) 99999-0002",
    email: "bruno.lima@con.local",
    senha: hashSenha("Professor@123"),
    endereco: "Avenida Brasil",
    numero: "45",
    complemento: null,
    bairro: "Jardins",
    cidade: "Sao Paulo",
    cep: "01400-000",
  },
  {
    nome: "Carla Menezes",
    cpf: "333.333.333-33",
    matricula: "DIR-001",
    cargo: "Diretor",
    telefone: "(11) 99999-0003",
    email: "carla.menezes@con.local",
    senha: hashSenha("Direcao@123"),
    endereco: "Rua da Escola",
    numero: "10",
    complemento: "Sala da diretoria",
    bairro: "Vila Nova",
    cidade: "Sao Paulo",
    cep: "02000-000",
  },
];

const salas: Prisma.SalaCreateManyInput[] = [
  {
    nome: "Sala Jardim A",
    numero: "A-01",
    capacidade: 20,
    andar: 1,
    bloco: "Bloco A",
    tipo: "Sala regular",
    descricao: "Sala com cantinho de leitura",
    ativa: true,
  },
  {
    nome: "Sala Jardim B",
    numero: "B-01",
    capacidade: 20,
    andar: 1,
    bloco: "Bloco B",
    tipo: "Sala regular",
    descricao: "Sala com espaco para atividades ludicas",
    ativa: true,
  },
];

const turmasBase = [
  {
    nome: "Jardim A",
    ano_letivo: 2026,
    turno: TURNOS[0],
    capacidade: 20,
    observacao: "Turma de criancas de 4 anos",
  },
  {
    nome: "Jardim B",
    ano_letivo: 2026,
    turno: TURNOS[1],
    capacidade: 20,
    observacao: "Turma de criancas de 5 anos",
  },
] as const;

const alunosBase = [
  {
    nome: "Alice Martins",
    data_nascimento: "2021-03-12",
    sexo: SEXOS[0],
    nome_responsavel: "Mariana Martins",
    telefone: "(11) 98888-0001",
    email: "mariana.martins@email.com",
    endereco: "Rua Um",
    numero: "101",
    complemento: null,
    bairro: "Centro",
    cidade: "Sao Paulo",
    cep: "01010-000",
    turmaNome: "Jardim A",
  },
  {
    nome: "Benicio Alves",
    data_nascimento: "2021-07-05",
    sexo: SEXOS[1],
    nome_responsavel: "Paulo Alves",
    telefone: "(11) 98888-0002",
    email: "paulo.alves@email.com",
    endereco: "Rua Dois",
    numero: "202",
    complemento: "Apto 12",
    bairro: "Vila Verde",
    cidade: "Sao Paulo",
    cep: "01111-000",
    turmaNome: "Jardim A",
  },
  {
    nome: "Clara Nunes",
    data_nascimento: "2020-11-22",
    sexo: SEXOS[0],
    nome_responsavel: "Juliana Nunes",
    telefone: "(11) 98888-0003",
    email: "juliana.nunes@email.com",
    endereco: "Rua Tres",
    numero: "303",
    complemento: null,
    bairro: "Parque Azul",
    cidade: "Sao Paulo",
    cep: "01222-000",
    turmaNome: "Jardim B",
  },
  {
    nome: "Davi Rocha",
    data_nascimento: "2020-09-14",
    sexo: SEXOS[1],
    nome_responsavel: "Fernanda Rocha",
    telefone: "(11) 98888-0004",
    email: "fernanda.rocha@email.com",
    endereco: "Rua Quatro",
    numero: "404",
    complemento: "Fundos",
    bairro: "Jardim Sol",
    cidade: "Sao Paulo",
    cep: "01333-000",
    turmaNome: "Jardim B",
  },
  {
    nome: "Emanuel Prado",
    data_nascimento: "2021-01-30",
    sexo: SEXOS[1],
    nome_responsavel: "Roberta Prado",
    telefone: "(11) 98888-0005",
    email: "roberta.prado@email.com",
    endereco: "Rua Cinco",
    numero: "505",
    complemento: null,
    bairro: "Vila Esperanca",
    cidade: "Sao Paulo",
    cep: "01444-000",
    turmaNome: pick(["Jardim A", "Jardim B"] as const),
  },
  {
    nome: "Fernanda Teixeira",
    data_nascimento: "2020-05-18",
    sexo: SEXOS[0],
    nome_responsavel: "Carlos Teixeira",
    telefone: "(11) 98888-0006",
    email: "carlos.teixeira@email.com",
    endereco: "Rua Seis",
    numero: "606",
    complemento: "Casa 2",
    bairro: "Parque Norte",
    cidade: "Sao Paulo",
    cep: "01555-000",
    turmaNome: pick(["Jardim A", "Jardim B"] as const),
  },
] as const;

async function main() {
  try {
    await prisma.chamada.deleteMany();
    await prisma.salaProfessor.deleteMany();
    await prisma.turmaProfessor.deleteMany();
    await prisma.aluno.deleteMany();
    await prisma.turma.deleteMany();
    await prisma.funcionario.deleteMany();
    await prisma.sala.deleteMany();
    await prisma.admin.deleteMany();

    const adminsCadastrados = await prisma.admin.createManyAndReturn({
      data: admins,
    });
    console.log(`${adminsCadastrados.length} Admin(s) cadastrados...`);

    const funcionariosCadastrados = await prisma.funcionario.createManyAndReturn({
      data: funcionarios,
    });
    console.log(`${funcionariosCadastrados.length} Funcionario(s) cadastrados...`);

    const salasCadastradas = await prisma.sala.createManyAndReturn({
      data: salas,
    });
    console.log(`${salasCadastradas.length} Sala(s) cadastradas...`);

    const salaPorNumero = new Map(salasCadastradas.map((s) => [s.numero, s]));

    const turmasCriadas = await Promise.all(
      turmasBase.map((turmaBase, indice) =>
        prisma.turma.create({
          data: {
            ...turmaBase,
            salaId: indice === 0 ? salaPorNumero.get("A-01")!.id : salaPorNumero.get("B-01")!.id,
          },
        }),
      ),
    );
    console.log(`${turmasCriadas.length} Turma(s) cadastradas...`);

    const professorAna = funcionariosCadastrados.find((f) => f.matricula === "PROF-001");
    const professorBruno = funcionariosCadastrados.find((f) => f.matricula === "PROF-002");
    const diretora = funcionariosCadastrados.find((f) => f.matricula === "DIR-001");

    if (!professorAna || !professorBruno || !diretora) {
      throw new Error("Funcionarios esperados nao foram criados corretamente.");
    }

    const turmaJardimA = turmasCriadas.find((t) => t.nome === "Jardim A");
    const turmaJardimB = turmasCriadas.find((t) => t.nome === "Jardim B");

    if (!turmaJardimA || !turmaJardimB) {
      throw new Error("Turmas esperadas nao foram criadas corretamente.");
    }

    const turmaProfessorCriados = await prisma.turmaProfessor.createManyAndReturn({
      data: [
        { turmaId: turmaJardimA.id, funcionarioId: professorAna.id },
        { turmaId: turmaJardimB.id, funcionarioId: professorBruno.id },
      ],
    });
    console.log(`${turmaProfessorCriados.length} vinculo(s) Turma x Professor cadastrados...`);

    const salaProfessorCriados = await prisma.salaProfessor.createManyAndReturn({
      data: [
        { salaId: turmaJardimA.salaId, funcionarioId: professorAna.id },
        { salaId: turmaJardimB.salaId, funcionarioId: professorBruno.id },
      ],
    });
    console.log(`${salaProfessorCriados.length} vinculo(s) Sala x Professor cadastrados...`);

    const turmaPorNome = new Map(turmasCriadas.map((t) => [t.nome, t]));

    const alunosData: Prisma.AlunoCreateManyInput[] = alunosBase.map((aluno) => ({
      nome: aluno.nome,
      data_nascimento: toDate(aluno.data_nascimento),
      sexo: aluno.sexo,
      nome_responsavel: aluno.nome_responsavel,
      telefone: aluno.telefone,
      email: aluno.email,
      endereco: aluno.endereco,
      numero: aluno.numero,
      complemento: aluno.complemento,
      bairro: aluno.bairro,
      cidade: aluno.cidade,
      cep: aluno.cep,
      turmaId: turmaPorNome.get(aluno.turmaNome)!.id,
    }));

    const alunosCadastrados = await prisma.aluno.createManyAndReturn({
      data: alunosData,
    });
    console.log(`${alunosCadastrados.length} Aluno(s) cadastrados...`);

    const turmaProfessorPorTurmaId = new Map(
      turmaProfessorCriados.map((tp) => [tp.turmaId, tp]),
    );

    const professorPorTurmaId = new Map<number, number>([
      [turmaJardimA.id, professorAna.id],
      [turmaJardimB.id, professorBruno.id],
    ]);

    const datasChamada = [toDate("2026-10-20"), toDate("2026-10-21")];

    const chamadasData: Prisma.ChamadaCreateManyInput[] = [];
    for (const aluno of alunosCadastrados) {
      for (const data of datasChamada) {
        const turmaProfessor = turmaProfessorPorTurmaId.get(aluno.turmaId);
        const funcionarioId = professorPorTurmaId.get(aluno.turmaId);

        if (!turmaProfessor || !funcionarioId) {
          throw new Error(`Nao foi possivel montar chamada para turmaId ${aluno.turmaId}.`);
        }

        chamadasData.push({
          data,
          presente: randomInt(0, 100) > 20,
          alunoId: aluno.id,
          turmaId: aluno.turmaId,
          funcionarioId,
          turmaProfessorId: turmaProfessor.id,
        });
      }
    }

    await prisma.chamada.createMany({ data: chamadasData });
    console.log(`${chamadasData.length} Chamada(s) cadastradas...`);

    console.log("Seed finalizado com sucesso.");
    console.log(`Admin principal: ${adminsCadastrados[0].email}`);
    console.log(`Direcao cadastrada: ${diretora.email}`);
  } catch (error) {
    console.error("Erro nas inclusoes (seeds):", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

await main();

// Conferência (somente leitura) dos vínculos Turma + Disciplina + Professor
// e da consistência das chamadas com esses vínculos.
// Uso: npx tsx check.ts
import { prisma } from "./lib/prisma"

async function main() {
    const vinculos = await prisma.turmaProfessor.findMany({
        include: {
            turma: { select: { nome: true } },
            disciplina: { select: { nome: true } },
            funcionario: { select: { nome: true } },
            _count: { select: { chamadas: true } },
        },
        orderBy: [{ turmaId: "asc" }, { disciplinaId: "asc" }],
    })

    console.log("Vínculos Turma x Disciplina x Professor:")
    console.table(
        vinculos.map((v) => ({
            vinculo_id: v.id,
            turma: v.turma.nome,
            disciplina: v.disciplina.nome,
            professor: v.funcionario.nome,
            chamadas: v._count.chamadas,
        })),
    )

    // Chamadas cuja turma/disciplina não bate com o vínculo apontado
    const inconsistentes = await prisma.$queryRaw<unknown[]>`
        SELECT c.id AS chamada_id, c.data, c."turmaId", c."disciplinaId",
               tp.id AS vinculo_id, tp."turmaId" AS vinculo_turma, tp."disciplinaId" AS vinculo_disciplina
        FROM chamadas c
        JOIN turmas_professores tp ON tp.id = c."turmaProfessorId"
        WHERE c."turmaId" <> tp."turmaId" OR c."disciplinaId" <> tp."disciplinaId"
        ORDER BY c.id
    `
    if (inconsistentes.length > 0) {
        console.log("Chamadas inconsistentes com o vínculo:")
        console.table(inconsistentes)
    } else {
        console.log("Todas as chamadas batem com o vínculo Turma x Disciplina x Professor.")
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

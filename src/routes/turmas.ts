import { Router } from "express"
import { z } from "zod"
import { prisma } from "../../lib/prisma"

const router = Router()

const turmaSchema = z.object({
  nome: z.string().trim().min(1, "Nome da turma é obrigatório").max(50),
  ano_letivo: z.number().int("Ano letivo deve ser um número inteiro").positive(),
  turno: z.string().trim().min(1, "Turno é obrigatório").max(20),
  salaId: z.number().int("salaId deve ser um número inteiro").positive(),
  capacidade: z.number().int("Capacidade deve ser um número inteiro").positive(),
  observacao: z.string().trim().max(10000).nullable().optional(),
})

const turmaUpdateSchema = turmaSchema.partial()

const vinculoSchema = z.object({
  disciplinaId: z.number().int("disciplinaId deve ser um número inteiro").positive(),
  funcionarioId: z.number().int("funcionarioId deve ser um número inteiro").positive(),
})

const turmaInclude = {
  sala: true,
  alunos: true,
  professores: {
    include: {
      funcionario: { select: { id: true, nome: true } },
      disciplina: { select: { id: true, nome: true } },
    },
  },
  _count: {
    select: {
      alunos: true,
      professores: true,
      chamadas: true,
    },
  },
} as const

function parseId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function validaSalaECapacidade(
  salaId: number,
  capacidade: number,
  turmaId?: number,
) {
  const sala = await prisma.sala.findUnique({
    where: { id: salaId },
  })

  if (!sala) {
    return { erro: "Sala não encontrada", status: 404 as const }
  }

  if (!sala.ativa) {
    return { erro: "Não é possível vincular a turma a uma sala inativa", status: 400 as const }
  }

  if (capacidade > sala.capacidade) {
    return {
      erro: "A capacidade da turma não pode ser maior que a capacidade da sala",
      status: 400 as const,
    }
  }

  const quantidadeAlunos = turmaId
    ? await prisma.aluno.count({ where: { turmaId } })
    : 0

  if (quantidadeAlunos > capacidade) {
    return {
      erro: "A capacidade informada não pode ser menor que a quantidade de alunos da turma",
      status: 400 as const,
    }
  }

  return null
}

router.get("/", async (_req, res) => {
  try {
    const turmas = await prisma.turma.findMany({
      include: turmaInclude,
      orderBy: [{ ano_letivo: "desc" }, { nome: "asc" }],
    })

    res.status(200).json(turmas)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar as turmas", detalhe: error })
  }
})

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const turma = await prisma.turma.findUnique({
      where: { id },
      include: turmaInclude,
    })

    if (!turma) {
      res.status(404).json({ erro: "Turma não encontrada" })
      return
    }

    res.status(200).json(turma)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar a turma", detalhe: error })
  }
})

router.post("/", async (req, res) => {
  const valida = turmaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const erroSala = await validaSalaECapacidade(
    valida.data.salaId,
    valida.data.capacidade,
  )
  if (erroSala) {
    res.status(erroSala.status).json({ erro: erroSala.erro })
    return
  }

  try {
    const turma = await prisma.turma.create({
      data: valida.data,
      include: turmaInclude,
    })

    res.status(201).json(turma)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível cadastrar a turma", detalhe: error })
  }
})

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  const valida = turmaUpdateSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  try {
    const turmaAtual = await prisma.turma.findUnique({
      where: { id },
      select: { salaId: true, capacidade: true },
    })

    if (!turmaAtual) {
      res.status(404).json({ erro: "Turma não encontrada" })
      return
    }

    const salaId = valida.data.salaId ?? turmaAtual.salaId
    const capacidade = valida.data.capacidade ?? turmaAtual.capacidade
    const erroSala = await validaSalaECapacidade(salaId, capacidade, id)
    if (erroSala) {
      res.status(erroSala.status).json({ erro: erroSala.erro })
      return
    }

    const turma = await prisma.turma.update({
      where: { id },
      data: valida.data,
      include: turmaInclude,
    })

    res.status(200).json(turma)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível atualizar a turma", detalhe: error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const turma = await prisma.turma.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            alunos: true,
            professores: true,
            chamadas: true,
          },
        },
      },
    })

    if (!turma) {
      res.status(404).json({ erro: "Turma não encontrada" })
      return
    }

    const { alunos, professores, chamadas } = turma._count
    if (alunos > 0 || professores > 0 || chamadas > 0) {
      res.status(409).json({
        erro: "A turma não pode ser excluída enquanto possuir alunos, professores ou chamadas vinculados",
      })
      return
    }

    const turmaExcluida = await prisma.turma.delete({ where: { id } })
    res.status(200).json(turmaExcluida)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível excluir a turma", detalhe: error })
  }
})

// POST /api/turmas/:turmaId/professores
// Vincula um professor a uma disciplina dentro da turma
router.post("/:turmaId/professores", async (req, res) => {
  const turmaId = parseId(req.params.turmaId)
  if (!turmaId) {
    res.status(400).json({ erro: "turmaId deve ser um número inteiro positivo" })
    return
  }

  const valida = vinculoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const { disciplinaId, funcionarioId } = valida.data

  try {
    const [turma, disciplina, funcionario] = await Promise.all([
      prisma.turma.findUnique({ where: { id: turmaId } }),
      prisma.disciplina.findUnique({ where: { id: disciplinaId } }),
      prisma.funcionario.findUnique({ where: { id: funcionarioId } }),
    ])

    if (!turma) {
      res.status(404).json({ erro: "Turma não encontrada" })
      return
    }
    if (!disciplina) {
      res.status(404).json({ erro: "Disciplina não encontrada" })
      return
    }
    if (!funcionario) {
      res.status(404).json({ erro: "Professor(a) não encontrado(a)" })
      return
    }

    const existente = await prisma.turmaProfessor.findUnique({
      where: { turmaId_disciplinaId: { turmaId, disciplinaId } },
    })
    if (existente) {
      res.status(409).json({
        erro: "Essa disciplina já tem um professor vinculado nessa turma. Remova o vínculo atual antes de trocar.",
      })
      return
    }

    const vinculo = await prisma.turmaProfessor.create({
      data: { turmaId, disciplinaId, funcionarioId },
      include: {
        disciplina: { select: { id: true, nome: true } },
        funcionario: { select: { id: true, nome: true } },
      },
    })

    res.status(201).json(vinculo)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível vincular o professor", detalhe: error })
  }
})

// DELETE /api/turmas/:turmaId/professores/:vinculoId
// Remove o vínculo, liberando a disciplina pra outro professor nessa turma
router.delete("/:turmaId/professores/:vinculoId", async (req, res) => {
  const turmaId = parseId(req.params.turmaId)
  const vinculoId = parseId(req.params.vinculoId)
  if (!turmaId || !vinculoId) {
    res.status(400).json({ erro: "turmaId e vinculoId devem ser números inteiros positivos" })
    return
  }

  try {
    const vinculo = await prisma.turmaProfessor.findUnique({
      where: { id: vinculoId },
      include: { _count: { select: { chamadas: true } } },
    })

    if (!vinculo || vinculo.turmaId !== turmaId) {
      res.status(404).json({ erro: "Vínculo não encontrado nessa turma" })
      return
    }

    if (vinculo._count.chamadas > 0) {
      res.status(409).json({
        erro: "Não é possível remover esse vínculo porque já existem chamadas registradas com ele",
      })
      return
    }

    await prisma.turmaProfessor.delete({ where: { id: vinculoId } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível remover o vínculo", detalhe: error })
  }
})

export default router
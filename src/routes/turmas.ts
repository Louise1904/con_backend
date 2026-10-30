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

const turmaInclude = {
  sala: true,
  alunos: true,
  professores: {
    include: {
      funcionario: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          matricula: true,
          cargo: true,
          telefone: true,
          email: true,
        },
      },
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

export default router

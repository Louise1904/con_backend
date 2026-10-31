import { Router } from "express"
import { z } from "zod"
import { prisma } from "../../lib/prisma"

const router = Router()

const salaSchema = z.object({
  nome: z.string().trim().min(1, "Nome da sala é obrigatório").max(50),
  numero: z.string().trim().min(1, "Número da sala é obrigatório").max(20),
  capacidade: z.coerce.number().int().positive("Capacidade deve ser maior que zero"),
  andar: z.coerce.number().int().nullable().optional(),
  bloco: z.string().trim().max(30).nullable().optional(),
  tipo: z.string().trim().min(1, "Tipo é obrigatório").max(30),
  descricao: z.string().trim().max(10000).nullable().optional(),
  ativa: z.boolean().optional(),
})

const salaUpdateSchema = salaSchema.partial()

const salaInclude = {
  turmas: { select: { id: true, nome: true, capacidade: true } },
  _count: { select: { turmas: true, professores: true } },
} as const

function parseId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function validaNumeroUnico(numero: string, salaId?: number) {
  const existente = await prisma.sala.findUnique({ where: { numero } })
  if (existente && (!salaId || existente.id !== salaId)) {
    return { erro: "Já existe uma sala com esse número", status: 409 as const }
  }
  return null
}

// GET /api/salas -> lista as salas (ativas primeiro)
router.get("/", async (_req, res) => {
  try {
    const salas = await prisma.sala.findMany({
      include: salaInclude,
      orderBy: [{ ativa: "desc" }, { nome: "asc" }],
    })
    res.status(200).json(salas)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar as salas", detalhe: error })
  }
})

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const sala = await prisma.sala.findUnique({ where: { id }, include: salaInclude })
    if (!sala) {
      res.status(404).json({ erro: "Sala não encontrada" })
      return
    }
    res.status(200).json(sala)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar a sala", detalhe: error })
  }
})

router.post("/", async (req, res) => {
  const valida = salaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  try {
    const erroNumero = await validaNumeroUnico(valida.data.numero)
    if (erroNumero) {
      res.status(erroNumero.status).json({ erro: erroNumero.erro })
      return
    }

    const sala = await prisma.sala.create({ data: valida.data, include: salaInclude })
    res.status(201).json(sala)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível cadastrar a sala", detalhe: error })
  }
})

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  const valida = salaUpdateSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  try {
    const salaAtual = await prisma.sala.findUnique({ where: { id }, include: salaInclude })
    if (!salaAtual) {
      res.status(404).json({ erro: "Sala não encontrada" })
      return
    }

    if (valida.data.numero) {
      const erroNumero = await validaNumeroUnico(valida.data.numero, id)
      if (erroNumero) {
        res.status(erroNumero.status).json({ erro: erroNumero.erro })
        return
      }
    }

    // A sala não pode ficar menor que alguma turma que já usa ela
    if (valida.data.capacidade) {
      const maiorTurma = Math.max(0, ...salaAtual.turmas.map((t) => t.capacidade))
      if (valida.data.capacidade < maiorTurma) {
        res.status(400).json({
          erro: `A capacidade não pode ser menor que ${maiorTurma}, que é a capacidade de uma turma desta sala`,
        })
        return
      }
    }

    const sala = await prisma.sala.update({
      where: { id },
      data: valida.data,
      include: salaInclude,
    })
    res.status(200).json(sala)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível atualizar a sala", detalhe: error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const sala = await prisma.sala.findUnique({ where: { id }, include: salaInclude })
    if (!sala) {
      res.status(404).json({ erro: "Sala não encontrada" })
      return
    }

    if (sala._count.turmas > 0 || sala._count.professores > 0) {
      res.status(409).json({
        erro: "A sala não pode ser excluída porque possui turmas ou professores vinculados. Você pode marcá-la como inativa.",
      })
      return
    }

    const salaExcluida = await prisma.sala.delete({ where: { id } })
    res.status(200).json(salaExcluida)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível excluir a sala", detalhe: error })
  }
})

export default router
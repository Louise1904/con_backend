import { Router } from "express"
import { z } from "zod"
import { prisma } from "../../lib/prisma"

const router = Router()

const disciplinaSchema = z.object({
  nome: z.string().trim().min(1, "Nome da disciplina é obrigatório").max(100),
  cargaHoraria: z.string().trim().max(20).optional(),
  professorNome: z.string().trim().max(100).optional(),
  descricao: z.string().trim().max(10000).optional(),
})

const disciplinaUpdateSchema = disciplinaSchema.partial()

function parseId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

router.get("/", async (_req, res) => {
  try {
    const disciplinas = await prisma.disciplina.findMany({ orderBy: { nome: "asc" } })
    res.status(200).json(disciplinas)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar as disciplinas", detalhe: error })
  }
})

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }
  try {
    const disciplina = await prisma.disciplina.findUnique({ where: { id } })
    if (!disciplina) {
      res.status(404).json({ erro: "Disciplina não encontrada" })
      return
    }
    res.status(200).json(disciplina)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar a disciplina", detalhe: error })
  }
})

router.post("/", async (req, res) => {
  const valida = disciplinaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }
  try {
    const disciplina = await prisma.disciplina.create({ data: valida.data })
    res.status(201).json(disciplina)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível cadastrar a disciplina", detalhe: error })
  }
})

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }
  const valida = disciplinaUpdateSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }
  try {
    const existe = await prisma.disciplina.findUnique({ where: { id } })
    if (!existe) {
      res.status(404).json({ erro: "Disciplina não encontrada" })
      return
    }
    const disciplina = await prisma.disciplina.update({ where: { id }, data: valida.data })
    res.status(200).json(disciplina)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível atualizar a disciplina", detalhe: error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }
  try {
    const disciplina = await prisma.disciplina.findUnique({
      where: { id },
      select: { id: true, _count: { select: { chamadas: true } } },
    })
    if (!disciplina) {
      res.status(404).json({ erro: "Disciplina não encontrada" })
      return
    }
    // Não deixa apagar disciplina com chamadas (perderia o histórico de frequência)
    if (disciplina._count.chamadas > 0) {
      res.status(409).json({
        erro: "A disciplina não pode ser excluída porque possui chamadas registradas",
      })
      return
    }
    await prisma.disciplina.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível excluir a disciplina", detalhe: error })
  }
})

export default router
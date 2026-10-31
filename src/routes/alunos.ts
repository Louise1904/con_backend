import { Router } from "express"
import { z } from "zod"
import { prisma } from "../../lib/prisma"

const router = Router()

const alunoSchema = z.object({
  matricula: z.string().trim().min(1, "Matrícula é obrigatória").max(20),
  nome: z.string().trim().min(3, "Nome é obrigatório").max(100),
  data_nascimento: z.coerce.date({ message: "Data de nascimento inválida" }),
  sexo: z.string().trim().min(1, "Sexo é obrigatório").max(20),

  nome_responsavel: z.string().trim().min(3, "Nome do responsável é obrigatório").max(100),
  telefone: z.string().trim().min(1, "Telefone é obrigatório").max(20),
  email: z.string().trim().email("Email inválido").max(100),

  endereco: z.string().trim().min(1, "Endereço é obrigatório").max(150),
  numero: z.string().trim().min(1, "Número é obrigatório").max(10),
  complemento: z.string().trim().max(50).nullable().optional(),
  bairro: z.string().trim().min(1, "Bairro é obrigatório").max(50),
  cidade: z.string().trim().min(1, "Cidade é obrigatória").max(50),
  cep: z.string().trim().min(8, "CEP é obrigatório").max(10),

  turmaId: z.coerce.number().int().positive("Turma é obrigatória"),
})

const alunoUpdateSchema = alunoSchema.partial()

const alunoInclude = {
  turma: {
    select: { id: true, nome: true, ano_letivo: true, turno: true },
  },
  _count: { select: { chamadas: true } },
} as const

function parseId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

// Verifica se a turma existe e se ainda tem vaga
async function validaTurma(turmaId: number) {
  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    select: { capacidade: true, _count: { select: { alunos: true } } },
  })

  if (!turma) {
    return { erro: "Turma não encontrada", status: 404 as const }
  }

  if (turma._count.alunos >= turma.capacidade) {
    return { erro: "A turma já atingiu a capacidade máxima de alunos", status: 400 as const }
  }

  return null
}

// Não deixa duas crianças com a mesma matrícula
async function validaMatriculaUnica(matricula: string, alunoId?: number) {
  const existente = await prisma.aluno.findUnique({ where: { matricula } })
  if (existente && (!alunoId || existente.id !== alunoId)) {
    return { erro: "Matrícula já cadastrada para outro aluno", status: 409 as const }
  }
  return null
}

// GET /api/alunos  ou  GET /api/alunos?turmaId=1
router.get("/", async (req, res) => {
  const turmaId = req.query.turmaId ? Number(req.query.turmaId) : undefined

  try {
    const alunos = await prisma.aluno.findMany({
      where: turmaId ? { turmaId } : undefined,
      include: alunoInclude,
      orderBy: { nome: "asc" },
    })
    res.status(200).json(alunos)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar os alunos", detalhe: error })
  }
})

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const aluno = await prisma.aluno.findUnique({ where: { id }, include: alunoInclude })
    if (!aluno) {
      res.status(404).json({ erro: "Aluno não encontrado" })
      return
    }
    res.status(200).json(aluno)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar o aluno", detalhe: error })
  }
})

router.post("/", async (req, res) => {
  const valida = alunoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  try {
    const erroMatricula = await validaMatriculaUnica(valida.data.matricula)
    if (erroMatricula) {
      res.status(erroMatricula.status).json({ erro: erroMatricula.erro })
      return
    }

    const erroTurma = await validaTurma(valida.data.turmaId)
    if (erroTurma) {
      res.status(erroTurma.status).json({ erro: erroTurma.erro })
      return
    }

    const aluno = await prisma.aluno.create({ data: valida.data, include: alunoInclude })
    res.status(201).json(aluno)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível cadastrar o aluno", detalhe: error })
  }
})

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  const valida = alunoUpdateSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  try {
    const alunoAtual = await prisma.aluno.findUnique({ where: { id } })
    if (!alunoAtual) {
      res.status(404).json({ erro: "Aluno não encontrado" })
      return
    }

    if (valida.data.matricula) {
      const erroMatricula = await validaMatriculaUnica(valida.data.matricula, id)
      if (erroMatricula) {
        res.status(erroMatricula.status).json({ erro: erroMatricula.erro })
        return
      }
    }

    // Só valida a capacidade se o aluno estiver mudando de turma
    if (valida.data.turmaId && valida.data.turmaId !== alunoAtual.turmaId) {
      const erroTurma = await validaTurma(valida.data.turmaId)
      if (erroTurma) {
        res.status(erroTurma.status).json({ erro: erroTurma.erro })
        return
      }
    }

    const aluno = await prisma.aluno.update({
      where: { id },
      data: valida.data,
      include: alunoInclude,
    })
    res.status(200).json(aluno)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível atualizar o aluno", detalhe: error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const aluno = await prisma.aluno.findUnique({
      where: { id },
      select: { id: true, _count: { select: { chamadas: true } } },
    })

    if (!aluno) {
      res.status(404).json({ erro: "Aluno não encontrado" })
      return
    }

    if (aluno._count.chamadas > 0) {
      res.status(409).json({
        erro: "O aluno não pode ser excluído porque possui chamadas registradas",
      })
      return
    }

    const alunoExcluido = await prisma.aluno.delete({ where: { id } })
    res.status(200).json(alunoExcluido)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível excluir o aluno", detalhe: error })
  }
})

export default router
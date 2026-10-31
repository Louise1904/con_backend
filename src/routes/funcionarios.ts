import { Router } from "express"
import bcrypt from "bcrypt"
import { z } from "zod"
import { prisma } from "../../lib/prisma"

const router = Router()

const funcionarioSchema = z.object({
  nome: z.string().trim().min(3, "Nome é obrigatório").max(100),
  cpf: z
    .string()
    .trim()
    .transform((valor) => valor.replace(/\D/g, "")) // tira tudo que não é número
    .refine((valor) => valor.length === 11, "CPF deve ter 11 dígitos")
    .transform((valor) =>
      valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"), // 11122233344 -> 111.222.333-44
    ),
  matricula: z.string().trim().min(1, "Matrícula é obrigatória").max(20),
  cargo: z.string().trim().min(1, "Cargo é obrigatório").max(50),
  telefone: z.string().trim().min(1, "Telefone é obrigatório").max(20),
  email: z.string().trim().min(1, "Email é obrigatório").email("Email inválido").max(100),
  senha: z.string().trim().min(6, "Senha deve ter no mínimo 6 caracteres").max(60),
  endereco: z.string().trim().min(1, "Endereço é obrigatório").max(150),
  numero: z.string().trim().min(1, "Número é obrigatório"),
  complemento: z.string().trim().max(100).optional(),
  bairro: z.string().trim().min(1, "Bairro é obrigatório").max(50),
  cidade: z.string().trim().min(1, "Cidade é obrigatória").max(50),
  cep: z
    .string()
    .trim()
    .transform((valor) => valor.replace(/\D/g, "")) // aceita com ou sem traço
    .refine((valor) => valor.length === 8, "CEP deve ter 8 dígitos")
    .transform((valor) => valor.replace(/(\d{5})(\d{3})/, "$1-$2")), // 01000000 -> 01000-000
})

const funcionarioUpdateSchema = funcionarioSchema.partial()

const funcionarioInclude = {
  turmas: {
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
          ano_letivo: true,
          turno: true,
        },
      },
    },
  },
  salas: {
    include: {
      sala: {
        select: {
          id: true,
          nome: true,
          numero: true,
        },
      },
    },
  },
  _count: {
    select: {
      turmas: true,
      salas: true,
      chamadas: true,
    },
  },
} as const

function parseId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function validaCpfUnico(cpf: string, funcionarioId?: number) {
  const existente = await prisma.funcionario.findUnique({ where: { cpf } })
  if (existente && (!funcionarioId || existente.id !== funcionarioId)) {
    return { erro: "CPF já cadastrado", status: 409 as const }
  }
  return null
}

async function validaMatriculaUnica(matricula: string, funcionarioId?: number) {
  const existente = await prisma.funcionario.findUnique({ where: { matricula } })
  if (existente && (!funcionarioId || existente.id !== funcionarioId)) {
    return { erro: "Matrícula já cadastrada", status: 409 as const }
  }
  return null
}

async function validaEmailUnico(email: string, funcionarioId?: number) {
  const existente = await prisma.funcionario.findFirst({ where: { email } })
  if (existente && (!funcionarioId || existente.id !== funcionarioId)) {
    return { erro: "Email já cadastrado", status: 409 as const }
  }
  return null
}

router.get("/", async (_req, res) => {
  try {
    const funcionarios = await prisma.funcionario.findMany({
      include: funcionarioInclude,
      orderBy: { nome: "asc" },
    })

    res.status(200).json(funcionarios)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar os funcionários", detalhe: error })
  }
})

router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const funcionario = await prisma.funcionario.findUnique({
      where: { id },
      include: funcionarioInclude,
    })

    if (!funcionario) {
      res.status(404).json({ erro: "Funcionário não encontrado" })
      return
    }

    res.status(200).json(funcionario)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar o funcionário", detalhe: error })
  }
})

router.post("/", async (req, res) => {
  const valida = funcionarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const erroCpf = await validaCpfUnico(valida.data.cpf)
  if (erroCpf) {
    res.status(erroCpf.status).json({ erro: erroCpf.erro })
    return
  }

  const erroMatricula = await validaMatriculaUnica(valida.data.matricula)
  if (erroMatricula) {
    res.status(erroMatricula.status).json({ erro: erroMatricula.erro })
    return
  }

  const erroEmail = await validaEmailUnico(valida.data.email)
  if (erroEmail) {
    res.status(erroEmail.status).json({ erro: erroEmail.erro })
    return
  }

  try {
    // Criptografa a senha antes de salvar (o login usa bcrypt.compare)
    const senhaHash = await bcrypt.hash(valida.data.senha, 12)

    const funcionario = await prisma.funcionario.create({
      data: { ...valida.data, senha: senhaHash },
      include: funcionarioInclude,
    })

    res.status(201).json(funcionario)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível cadastrar o funcionário", detalhe: error })
  }
})

router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  const valida = funcionarioUpdateSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  try {
    const funcionarioAtual = await prisma.funcionario.findUnique({
      where: { id },
    })

    if (!funcionarioAtual) {
      res.status(404).json({ erro: "Funcionário não encontrado" })
      return
    }

    if (valida.data.cpf) {
      const erroCpf = await validaCpfUnico(valida.data.cpf, id)
      if (erroCpf) {
        res.status(erroCpf.status).json({ erro: erroCpf.erro })
        return
      }
    }

    if (valida.data.matricula) {
      const erroMatricula = await validaMatriculaUnica(valida.data.matricula, id)
      if (erroMatricula) {
        res.status(erroMatricula.status).json({ erro: erroMatricula.erro })
        return
      }
    }

    if (valida.data.email) {
      const erroEmail = await validaEmailUnico(valida.data.email, id)
      if (erroEmail) {
        res.status(erroEmail.status).json({ erro: erroEmail.erro })
        return
      }
    }

    // Se a senha foi enviada na edição, criptografa também
    if (valida.data.senha) {
      valida.data.senha = await bcrypt.hash(valida.data.senha, 12)
    }

    const funcionario = await prisma.funcionario.update({
      where: { id },
      data: valida.data,
      include: funcionarioInclude,
    })

    res.status(200).json(funcionario)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível atualizar o funcionário", detalhe: error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id)
  if (!id) {
    res.status(400).json({ erro: "id deve ser um número inteiro positivo" })
    return
  }

  try {
    const funcionario = await prisma.funcionario.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            turmas: true,
            salas: true,
            chamadas: true,
          },
        },
      },
    })

    if (!funcionario) {
      res.status(404).json({ erro: "Funcionário não encontrado" })
      return
    }

    const { turmas, salas, chamadas } = funcionario._count
    if (turmas > 0 || salas > 0 || chamadas > 0) {
      res.status(409).json({
        erro: "O funcionário não pode ser excluído enquanto possuir turmas, salas ou chamadas vinculados",
      })
      return
    }

    const funcionarioExcluido = await prisma.funcionario.delete({ where: { id } })
    res.status(200).json(funcionarioExcluido)
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível excluir o funcionário", detalhe: error })
  }
})

export default router
import "dotenv/config"
import bcrypt from "bcrypt"
import cors from "cors"
import express from "express"
import { z } from "zod"
import { prisma } from "../lib/prisma"
import routesTurmas from "./routes/turmas"
import routesFuncionarios from "./routes/funcionarios"

const app = express()
const port = Number(process.env.PORT) || 3000

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
})

app.use(express.json())
app.use(cors())

app.post("/api/login", async (req, res) => {
  const valida = loginSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const { email, senha } = valida.data

  // Tenta autenticar como Admin (Diretor)
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (admin) {
    const senhaValida = await bcrypt.compare(senha, admin.senha)
    if (senhaValida) {
      res.status(200).json({
        message: "Login realizado com sucesso",
        user: {
          id: admin.id,
          email: admin.email,
          tipo: "ADM",
          nome: admin.nome,
        },
      })
      return
    }
  }

  // Tenta autenticar como Funcionario (Professor)
  const funcionario = await prisma.funcionario.findFirst({ where: { email } })
  if (funcionario) {
    const senhaValida = await bcrypt.compare(senha, funcionario.senha)
    if (senhaValida) {
      res.status(200).json({
        message: "Login realizado com sucesso",
        user: {
          id: funcionario.id,
          email: funcionario.email,
          tipo: "PROFESSOR",
          nome: funcionario.nome,
        },
      })
      return
    }
  }

  res.status(401).json({ erro: "E-mail ou senha incorretos" })
})

app.use("/api/turmas", routesTurmas)
app.use("/api/funcionarios", routesFuncionarios)

app.get("/", (_req, res) => {
  res.send("API: CON - Chamada Online")
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})

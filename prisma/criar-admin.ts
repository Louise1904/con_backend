import "dotenv/config"
import bcrypt from "bcrypt"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const email = "direcao@con.local"
  const senha = await bcrypt.hash("Admin@123", 12)

  // upsert = se já existe, atualiza a senha; se não existe, cria.
  // Não apaga nenhum outro dado do banco.
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { senha },
    create: { nome: "Direcao Geral", email, senha },
  })

  console.log(`Admin pronto: ${admin.email} / Admin@123`)
}

main()
  .catch((erro) => {
    console.error("Erro ao criar admin:", erro)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
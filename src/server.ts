import "dotenv/config"
import cors from "cors"
import express from "express"
import routesTurmas from "./routes/turmas"
import routesFuncionarios from "./routes/funcionarios"

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(express.json())
app.use(cors())

app.use("/turmas", routesTurmas)
app.use("/funcionarios", routesFuncionarios)

app.get("/", (_req, res) => {
  res.send("API: CON - Chamada Online")
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})

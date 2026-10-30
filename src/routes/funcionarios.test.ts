import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import express from "express"
import request from "supertest"
import routesFuncionarios from "./funcionarios.js"
import { mockPrisma } from "../test/setup.js"

const app = express()
app.use(express.json())
app.use("/funcionarios", routesFuncionarios)

const mockFuncionario = {
  id: 1,
  nome: "João Silva",
  cpf: "123.456.789-00",
  matricula: "MAT001",
  cargo: "Professor",
  telefone: "(11) 99999-9999",
  email: "joao@email.com",
  senha: "senha123",
  endereco: "Rua das Flores",
  numero: "123",
  complemento: "Apto 45",
  bairro: "Centro",
  cidade: "São Paulo",
  cep: "01234567",
  turmas: [],
  salas: [],
  _count: {
    turmas: 0,
    salas: 0,
    chamadas: 0,
  },
}

const mockFuncionarios = [mockFuncionario]

describe("Rotas de Funcionários", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("GET /funcionarios", () => {
    it("deve retornar lista de funcionários com status 200", async () => {
      mockPrisma.funcionario.findMany.mockResolvedValue(mockFuncionarios)

      const response = await request(app).get("/funcionarios").expect(200)

      expect(response.body).toEqual(mockFuncionarios)
      expect(mockPrisma.funcionario.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: { nome: "asc" },
      })
    })

    it("deve retornar erro 500 quando falha ao buscar funcionários", async () => {
      mockPrisma.funcionario.findMany.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app).get("/funcionarios").expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível consultar os funcionários")
    })
  })

  describe("GET /funcionarios/:id", () => {
    it("deve retornar funcionário por ID com status 200", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue(mockFuncionario)

      const response = await request(app).get("/funcionarios/1").expect(200)

      expect(response.body).toEqual(mockFuncionario)
      expect(mockPrisma.funcionario.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      })
    })

    it("deve retornar erro 400 para ID inválido", async () => {
      const response = await request(app).get("/funcionarios/abc").expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 400 para ID negativo", async () => {
      const response = await request(app).get("/funcionarios/-1").expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 404 quando funcionário não encontrado", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue(null)

      const response = await request(app).get("/funcionarios/999").expect(404)

      expect(response.body).toHaveProperty("erro", "Funcionário não encontrado")
    })

    it("deve retornar erro 500 quando falha ao buscar funcionário", async () => {
      mockPrisma.funcionario.findUnique.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app).get("/funcionarios/1").expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível consultar o funcionário")
    })
  })

  describe("POST /funcionarios", () => {
    const novoFuncionario = {
      nome: "Maria Santos",
      cpf: "987.654.321-00",
      matricula: "MAT002",
      cargo: "Coordenador",
      telefone: "(11) 88888-8888",
      email: "maria@email.com",
      senha: "senha456",
      endereco: "Av. Principal",
      numero: "456",
      complemento: "Sala 10",
      bairro: "Jardins",
      cidade: "São Paulo",
      cep: "04567890",
    }

    it("deve criar funcionário com status 201", async () => {
      mockPrisma.funcionario.findUnique
        .mockResolvedValueOnce(null) // CPF
        .mockResolvedValueOnce(null) // Matrícula
        .mockResolvedValueOnce(null) // Email

      mockPrisma.funcionario.create.mockResolvedValue({
        id: 2,
        ...novoFuncionario,
        turmas: [],
        salas: [],
        _count: { turmas: 0, salas: 0, chamadas: 0 },
      })

      const response = await request(app)
        .post("/funcionarios")
        .send(novoFuncionario)
        .expect(201)

      expect(response.body).toHaveProperty("id", 2)
      expect(response.body.nome).toBe(novoFuncionario.nome)
      expect(mockPrisma.funcionario.create).toHaveBeenCalledWith({
        data: novoFuncionario,
        include: expect.any(Object),
      })
    })

    it("deve retornar erro 400 para dados inválidos", async () => {
      const dadosInvalidos = {
        nome: "Jo", // muito curto
        cpf: "123", // inválido
        matricula: "",
        cargo: "",
        telefone: "",
        email: "email-invalido",
        senha: "123", // muito curta
        endereco: "",
        numero: "",
        bairro: "",
        cidade: "",
        cep: "123",
      }

      const response = await request(app)
        .post("/funcionarios")
        .send(dadosInvalidos)
        .expect(400)

      expect(response.body).toHaveProperty("erro")
      expect(response.body.erro).toHaveProperty("formErrors")
    })

    it("deve retornar erro 409 quando CPF já cadastrado", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValueOnce(mockFuncionario) // CPF já existe

      const response = await request(app)
        .post("/funcionarios")
        .send(novoFuncionario)
        .expect(409)

      expect(response.body).toHaveProperty("erro", "CPF já cadastrado")
    })

    it("deve retornar erro 409 quando matrícula já cadastrada", async () => {
      mockPrisma.funcionario.findUnique
        .mockResolvedValueOnce(null) // CPF ok
        .mockResolvedValueOnce(mockFuncionario) // Matrícula já existe

      const response = await request(app)
        .post("/funcionarios")
        .send(novoFuncionario)
        .expect(409)

      expect(response.body).toHaveProperty("erro", "Matrícula já cadastrada")
    })

    it("deve retornar erro 409 quando email já cadastrado", async () => {
      mockPrisma.funcionario.findUnique
        .mockResolvedValueOnce(null) // CPF ok
        .mockResolvedValueOnce(null) // Matrícula ok

      mockPrisma.funcionario.findFirst.mockResolvedValueOnce(mockFuncionario) // Email já existe

      const response = await request(app)
        .post("/funcionarios")
        .send(novoFuncionario)
        .expect(409)

      expect(response.body).toHaveProperty("erro", "Email já cadastrado")
    })

    it("deve retornar erro 500 quando falha ao criar funcionário", async () => {
      mockPrisma.funcionario.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)

      mockPrisma.funcionario.create.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app)
        .post("/funcionarios")
        .send(novoFuncionario)
        .expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível cadastrar o funcionário")
    })
  })

  describe("PUT /funcionarios/:id", () => {
    const dadosAtualizacao = {
      nome: "João Silva Atualizado",
      telefone: "(11) 77777-7777",
    }

    it("deve atualizar funcionário com status 200", async () => {
      mockPrisma.funcionario.findUnique
        .mockResolvedValueOnce(mockFuncionario) // busca funcionário atual
        .mockResolvedValueOnce(null) // CPF (não enviado)
        .mockResolvedValueOnce(null) // Matrícula (não enviada)
        .mockResolvedValueOnce(null) // Email (não enviado)

      mockPrisma.funcionario.update.mockResolvedValue({
        ...mockFuncionario,
        ...dadosAtualizacao,
      })

      const response = await request(app)
        .put("/funcionarios/1")
        .send(dadosAtualizacao)
        .expect(200)

      expect(response.body.nome).toBe(dadosAtualizacao.nome)
      expect(response.body.telefone).toBe(dadosAtualizacao.telefone)
      expect(mockPrisma.funcionario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dadosAtualizacao,
        include: expect.any(Object),
      })
    })

    it("deve retornar erro 400 para ID inválido", async () => {
      const response = await request(app)
        .put("/funcionarios/abc")
        .send(dadosAtualizacao)
        .expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 400 para dados inválidos", async () => {
      const dadosInvalidos = {
        email: "email-invalido",
        senha: "123",
      }

      const response = await request(app)
        .put("/funcionarios/1")
        .send(dadosInvalidos)
        .expect(400)

      expect(response.body).toHaveProperty("erro")
    })

    it("deve retornar erro 404 quando funcionário não encontrado", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .put("/funcionarios/999")
        .send(dadosAtualizacao)
        .expect(404)

      expect(response.body).toHaveProperty("erro", "Funcionário não encontrado")
    })

    it("deve retornar erro 409 quando CPF já cadastrado por outro funcionário", async () => {
      mockPrisma.funcionario.findUnique
        .mockResolvedValueOnce(mockFuncionario) // funcionário atual
        .mockResolvedValueOnce({ ...mockFuncionario, id: 2 }) // CPF já existe em outro

      const response = await request(app)
        .put("/funcionarios/1")
        .send({ ...dadosAtualizacao, cpf: "123.456.789-00" })
        .expect(409)

      expect(response.body).toHaveProperty("erro", "CPF já cadastrado")
    })

    it("deve retornar erro 500 quando falha ao atualizar funcionário", async () => {
      mockPrisma.funcionario.findUnique
        .mockResolvedValueOnce(mockFuncionario)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)

      mockPrisma.funcionario.update.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app)
        .put("/funcionarios/1")
        .send(dadosAtualizacao)
        .expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível atualizar o funcionário")
    })
  })

  describe("DELETE /funcionarios/:id", () => {
    it("deve excluir funcionário com status 200", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue({
        id: 1,
        _count: { turmas: 0, salas: 0, chamadas: 0 },
      })

      mockPrisma.funcionario.delete.mockResolvedValue(mockFuncionario)

      const response = await request(app).delete("/funcionarios/1").expect(200)

      expect(response.body).toEqual(mockFuncionario)
      expect(mockPrisma.funcionario.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it("deve retornar erro 400 para ID inválido", async () => {
      const response = await request(app).delete("/funcionarios/abc").expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 404 quando funcionário não encontrado", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue(null)

      const response = await request(app).delete("/funcionarios/999").expect(404)

      expect(response.body).toHaveProperty("erro", "Funcionário não encontrado")
    })

    it("deve retornar erro 409 quando funcionário possui turmas vinculadas", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue({
        id: 1,
        _count: { turmas: 1, salas: 0, chamadas: 0 },
      })

      const response = await request(app).delete("/funcionarios/1").expect(409)

      expect(response.body).toHaveProperty(
        "erro",
        "O funcionário não pode ser excluído enquanto possuir turmas, salas ou chamadas vinculados"
      )
    })

    it("deve retornar erro 409 quando funcionário possui salas vinculadas", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue({
        id: 1,
        _count: { turmas: 0, salas: 1, chamadas: 0 },
      })

      const response = await request(app).delete("/funcionarios/1").expect(409)

      expect(response.body).toHaveProperty(
        "erro",
        "O funcionário não pode ser excluído enquanto possuir turmas, salas ou chamadas vinculados"
      )
    })

    it("deve retornar erro 409 quando funcionário possui chamadas vinculadas", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue({
        id: 1,
        _count: { turmas: 0, salas: 0, chamadas: 1 },
      })

      const response = await request(app).delete("/funcionarios/1").expect(409)

      expect(response.body).toHaveProperty(
        "erro",
        "O funcionário não pode ser excluído enquanto possuir turmas, salas ou chamadas vinculados"
      )
    })

    it("deve retornar erro 500 quando falha ao excluir funcionário", async () => {
      mockPrisma.funcionario.findUnique.mockResolvedValue({
        id: 1,
        _count: { turmas: 0, salas: 0, chamadas: 0 },
      })

      mockPrisma.funcionario.delete.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app).delete("/funcionarios/1").expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível excluir o funcionário")
    })
  })
})
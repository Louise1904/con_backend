import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import express from "express"
import request from "supertest"
import routesTurmas from "./turmas.js"
import { mockPrisma } from "../test/setup.js"

const app = express()
app.use(express.json())
app.use("/turmas", routesTurmas)

const mockSala = {
  id: 1,
  nome: "Sala 101",
  numero: "101",
  capacidade: 30,
  andar: 1,
  bloco: "A",
  tipo: "Sala de Aula",
  descricao: "Sala principal",
  ativa: true,
}

const mockTurma = {
  id: 1,
  nome: "Turma A",
  ano_letivo: 2024,
  turno: "Manhã",
  salaId: 1,
  capacidade: 25,
  observacao: "Turma de teste",
  sala: mockSala,
  alunos: [],
  professores: [],
  _count: {
    alunos: 0,
    professores: 0,
    chamadas: 0,
  },
}

const mockTurmas = [mockTurma]

describe("Rotas de Turmas", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe("GET /turmas", () => {
    it("deve retornar lista de turmas com status 200", async () => {
      mockPrisma.turma.findMany.mockResolvedValue(mockTurmas)

      const response = await request(app).get("/turmas").expect(200)

      expect(response.body).toEqual(mockTurmas)
      expect(mockPrisma.turma.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: [{ ano_letivo: "desc" }, { nome: "asc" }],
      })
    })

    it("deve retornar erro 500 quando falha ao buscar turmas", async () => {
      mockPrisma.turma.findMany.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app).get("/turmas").expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível consultar as turmas")
    })
  })

  describe("GET /turmas/:id", () => {
    it("deve retornar turma por ID com status 200", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(mockTurma)

      const response = await request(app).get("/turmas/1").expect(200)

      expect(response.body).toEqual(mockTurma)
      expect(mockPrisma.turma.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      })
    })

    it("deve retornar erro 400 para ID inválido", async () => {
      const response = await request(app).get("/turmas/abc").expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 400 para ID negativo", async () => {
      const response = await request(app).get("/turmas/-1").expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 404 quando turma não encontrada", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(null)

      const response = await request(app).get("/turmas/999").expect(404)

      expect(response.body).toHaveProperty("erro", "Turma não encontrada")
    })

    it("deve retornar erro 500 quando falha ao buscar turma", async () => {
      mockPrisma.turma.findUnique.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app).get("/turmas/1").expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível consultar a turma")
    })
  })

  describe("POST /turmas", () => {
    const novaTurma = {
      nome: "Turma B",
      ano_letivo: 2024,
      turno: "Tarde",
      salaId: 1,
      capacidade: 20,
      observacao: "Nova turma",
    }

    it("deve criar turma com status 201", async () => {
      mockPrisma.sala.findUnique.mockResolvedValue(mockSala)
      mockPrisma.aluno.count.mockResolvedValue(0)
      mockPrisma.turma.create.mockResolvedValue({
        id: 2,
        ...novaTurma,
        sala: mockSala,
        alunos: [],
        professores: [],
        _count: { alunos: 0, professores: 0, chamadas: 0 },
      })

      const response = await request(app)
        .post("/turmas")
        .send(novaTurma)
        .expect(201)

      expect(response.body).toHaveProperty("id", 2)
      expect(response.body.nome).toBe(novaTurma.nome)
      expect(mockPrisma.turma.create).toHaveBeenCalledWith({
        data: novaTurma,
        include: expect.any(Object),
      })
    })

    it("deve retornar erro 400 para dados inválidos", async () => {
      const dadosInvalidos = {
        nome: "",
        ano_letivo: -1,
        turno: "",
        salaId: 0,
        capacidade: 0,
      }

      const response = await request(app)
        .post("/turmas")
        .send(dadosInvalidos)
        .expect(400)

      expect(response.body).toHaveProperty("erro")
      expect(response.body.erro).toHaveProperty("formErrors")
    })

    it("deve retornar erro 404 quando sala não encontrada", async () => {
      mockPrisma.sala.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .post("/turmas")
        .send(novaTurma)
        .expect(404)

      expect(response.body).toHaveProperty("erro", "Sala não encontrada")
    })

    it("deve retornar erro 400 quando sala está inativa", async () => {
      mockPrisma.sala.findUnique.mockResolvedValue({ ...mockSala, ativa: false })

      const response = await request(app)
        .post("/turmas")
        .send(novaTurma)
        .expect(400)

      expect(response.body).toHaveProperty("erro", "Não é possível vincular a turma a uma sala inativa")
    })

    it("deve retornar erro 400 quando capacidade da turma excede capacidade da sala", async () => {
      mockPrisma.sala.findUnique.mockResolvedValue({ ...mockSala, capacidade: 15 })

      const response = await request(app)
        .post("/turmas")
        .send({ ...novaTurma, capacidade: 20 })
        .expect(400)

      expect(response.body).toHaveProperty(
        "erro",
        "A capacidade da turma não pode ser maior que a capacidade da sala"
      )
    })

    it("deve retornar erro 500 quando falha ao criar turma", async () => {
      mockPrisma.sala.findUnique.mockResolvedValue(mockSala)
      mockPrisma.aluno.count.mockResolvedValue(0)
      mockPrisma.turma.create.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app)
        .post("/turmas")
        .send(novaTurma)
        .expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível cadastrar a turma")
    })
  })

  describe("PUT /turmas/:id", () => {
    const dadosAtualizacao = {
      nome: "Turma A Atualizada",
      capacidade: 30,
    }

    it("deve atualizar turma com status 200", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(mockTurma)
      mockPrisma.sala.findUnique.mockResolvedValue(mockSala)
      mockPrisma.aluno.count.mockResolvedValue(0)
      mockPrisma.turma.update.mockResolvedValue({
        ...mockTurma,
        ...dadosAtualizacao,
      })

      const response = await request(app)
        .put("/turmas/1")
        .send(dadosAtualizacao)
        .expect(200)

      expect(response.body.nome).toBe(dadosAtualizacao.nome)
      expect(response.body.capacidade).toBe(dadosAtualizacao.capacidade)
      expect(mockPrisma.turma.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dadosAtualizacao,
        include: expect.any(Object),
      })
    })

    it("deve retornar erro 400 para ID inválido", async () => {
      const response = await request(app)
        .put("/turmas/abc")
        .send(dadosAtualizacao)
        .expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 400 para dados inválidos", async () => {
      const dadosInvalidos = {
        ano_letivo: -1,
        capacidade: 0,
      }

      const response = await request(app)
        .put("/turmas/1")
        .send(dadosInvalidos)
        .expect(400)

      expect(response.body).toHaveProperty("erro")
    })

    it("deve retornar erro 404 quando turma não encontrada", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .put("/turmas/999")
        .send(dadosAtualizacao)
        .expect(404)

      expect(response.body).toHaveProperty("erro", "Turma não encontrada")
    })

    it("deve retornar erro 404 quando nova sala não encontrada", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(mockTurma)
      mockPrisma.sala.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .put("/turmas/1")
        .send({ ...dadosAtualizacao, salaId: 999 })
        .expect(404)

      expect(response.body).toHaveProperty("erro", "Sala não encontrada")
    })

    it("deve retornar erro 400 quando nova capacidade menor que alunos matriculados", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(mockTurma)
      mockPrisma.sala.findUnique.mockResolvedValue(mockSala)
      mockPrisma.aluno.count.mockResolvedValue(25)

      const response = await request(app)
        .put("/turmas/1")
        .send({ ...dadosAtualizacao, capacidade: 20 })
        .expect(400)

      expect(response.body).toHaveProperty(
        "erro",
        "A capacidade informada não pode ser menor que a quantidade de alunos da turma"
      )
    })

    it("deve retornar erro 500 quando falha ao atualizar turma", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(mockTurma)
      mockPrisma.sala.findUnique.mockResolvedValue(mockSala)
      mockPrisma.aluno.count.mockResolvedValue(0)
      mockPrisma.turma.update.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app)
        .put("/turmas/1")
        .send(dadosAtualizacao)
        .expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível atualizar a turma")
    })
  })

  describe("DELETE /turmas/:id", () => {
    it("deve excluir turma com status 200", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue({
        id: 1,
        _count: { alunos: 0, professores: 0, chamadas: 0 },
      })

      mockPrisma.turma.delete.mockResolvedValue(mockTurma)

      const response = await request(app).delete("/turmas/1").expect(200)

      expect(response.body).toEqual(mockTurma)
      expect(mockPrisma.turma.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it("deve retornar erro 400 para ID inválido", async () => {
      const response = await request(app).delete("/turmas/abc").expect(400)

      expect(response.body).toHaveProperty("erro", "id deve ser um número inteiro positivo")
    })

    it("deve retornar erro 404 quando turma não encontrada", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue(null)

      const response = await request(app).delete("/turmas/999").expect(404)

      expect(response.body).toHaveProperty("erro", "Turma não encontrada")
    })

    it("deve retornar erro 409 quando turma possui alunos vinculados", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue({
        id: 1,
        _count: { alunos: 1, professores: 0, chamadas: 0 },
      })

      const response = await request(app).delete("/turmas/1").expect(409)

      expect(response.body).toHaveProperty(
        "erro",
        "A turma não pode ser excluída enquanto possuir alunos, professores ou chamadas vinculados"
      )
    })

    it("deve retornar erro 409 quando turma possui professores vinculados", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue({
        id: 1,
        _count: { alunos: 0, professores: 1, chamadas: 0 },
      })

      const response = await request(app).delete("/turmas/1").expect(409)

      expect(response.body).toHaveProperty(
        "erro",
        "A turma não pode ser excluída enquanto possuir alunos, professores ou chamadas vinculados"
      )
    })

    it("deve retornar erro 409 quando turma possui chamadas vinculadas", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue({
        id: 1,
        _count: { alunos: 0, professores: 0, chamadas: 1 },
      })

      const response = await request(app).delete("/turmas/1").expect(409)

      expect(response.body).toHaveProperty(
        "erro",
        "A turma não pode ser excluída enquanto possuir alunos, professores ou chamadas vinculados"
      )
    })

    it("deve retornar erro 500 quando falha ao excluir turma", async () => {
      mockPrisma.turma.findUnique.mockResolvedValue({
        id: 1,
        _count: { alunos: 0, professores: 0, chamadas: 0 },
      })

      mockPrisma.turma.delete.mockRejectedValue(new Error("Erro no banco"))

      const response = await request(app).delete("/turmas/1").expect(500)

      expect(response.body).toHaveProperty("erro", "Não foi possível excluir a turma")
    })
  })
})
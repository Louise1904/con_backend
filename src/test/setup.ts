import { jest } from "@jest/globals"

// Mock do PrismaClient
const mockPrisma = {
  funcionario: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  turma: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  sala: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  aluno: {
    count: jest.fn(),
  },
  turmaProfessor: {
    count: jest.fn(),
  },
  salaProfessor: {
    count: jest.fn(),
  },
  chamada: {
    count: jest.fn(),
  },
  $disconnect: jest.fn(),
}

// Mock do módulo lib/prisma
jest.unstable_mockModule("../../lib/prisma", () => ({
  prisma: mockPrisma,
}))

export { mockPrisma }
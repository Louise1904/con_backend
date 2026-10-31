import { Router } from "express"
import { z } from "zod"
import { prisma } from "../../lib/prisma"

const router = Router()

// "2026-10-31" -> Date em UTC (mesmo padrão do seed)
function toDate(data: string) {
  return new Date(`${data}T00:00:00.000Z`)
}

const dataRegex = /^\d{4}-\d{2}-\d{2}$/

const filtroSchema = z.object({
  turmaId: z.coerce.number().int().positive("turmaId é obrigatório"),
  disciplinaId: z.coerce.number().int().positive("disciplinaId é obrigatório"),
  data: z.string().regex(dataRegex, "data deve estar no formato AAAA-MM-DD"),
})

const chamadaSchema = filtroSchema.extend({
  funcionarioId: z.number().int().positive("Professor(a) é obrigatório"),
  presencas: z
    .array(
      z.object({
        alunoId: z.number().int().positive(),
        presente: z.boolean(),
      }),
    )
    .min(1, "A chamada precisa ter pelo menos um aluno"),
})

const exportarSchema = z.object({
  turmaId: z.coerce.number().int().positive("turmaId é obrigatório"),
  disciplinaId: z.coerce.number().int().positive("disciplinaId é obrigatório"),
  mes: z.string().regex(/^\d{4}-\d{2}$/, "mes deve estar no formato AAAA-MM"),
})

// GET /api/chamadas?turmaId=1&disciplinaId=1&data=2026-10-31
// Lista os alunos da turma com a situação no dia (null = chamada ainda não feita)
router.get("/", async (req, res) => {
  const valida = filtroSchema.safeParse(req.query)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const { turmaId, disciplinaId, data } = valida.data

  try {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: { alunos: { orderBy: { nome: "asc" } } },
    })
    if (!turma) {
      res.status(404).json({ erro: "Turma não encontrada" })
      return
    }

    const registros = await prisma.chamada.findMany({
      where: { turmaId, disciplinaId, data: toDate(data) },
    })

    // Mapa alunoId -> presente, para achar rápido a situação de cada aluno
    const situacao = new Map(registros.map((r) => [r.alunoId, r.presente]))

    res.status(200).json({
      turmaId,
      disciplinaId,
      data,
      jaRealizada: registros.length > 0,
      alunos: turma.alunos.map((aluno) => ({
        id: aluno.id,
        nome: aluno.nome,
        presente: situacao.get(aluno.id) ?? null,
      })),
    })
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível consultar a chamada", detalhe: error })
  }
})

// GET /api/chamadas/exportar?turmaId=1&disciplinaId=1&mes=2026-10
// Devolve os dados do mês organizados para o diário de classe (PDF)
router.get("/exportar", async (req, res) => {
  const valida = exportarSchema.safeParse(req.query)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const { turmaId, disciplinaId, mes } = valida.data
  const [ano, mesNumero] = mes.split("-").map(Number)

  // Intervalo do mês: do dia 1 (incluso) até o dia 1 do mês seguinte (excluso)
  const inicio = new Date(Date.UTC(ano, mesNumero - 1, 1))
  const fim = new Date(Date.UTC(ano, mesNumero, 1))
  // Dia 0 do mês seguinte = último dia deste mês (28, 29, 30 ou 31)
  const diasNoMes = new Date(Date.UTC(ano, mesNumero, 0)).getUTCDate()

  try {
    const [turma, disciplina] = await Promise.all([
      prisma.turma.findUnique({
        where: { id: turmaId },
        include: { alunos: { orderBy: { nome: "asc" } } },
      }),
      prisma.disciplina.findUnique({ where: { id: disciplinaId } }),
    ])

    if (!turma) {
      res.status(404).json({ erro: "Turma não encontrada" })
      return
    }
    if (!disciplina) {
      res.status(404).json({ erro: "Disciplina não encontrada" })
      return
    }

    const registros = await prisma.chamada.findMany({
      where: { turmaId, disciplinaId, data: { gte: inicio, lt: fim } },
      include: { funcionario: { select: { nome: true } } },
      orderBy: { data: "asc" },
    })

    // Dias do mês em que houve chamada (ex: [20, 21, 27])
    const diasComChamada = [...new Set(registros.map((r) => r.data.getUTCDate()))]

    const alunos = turma.alunos.map((aluno, indice) => {
      // Um espaço por dia do mês: "P", "F" ou null (sem chamada)
      const dias: ("P" | "F" | null)[] = Array(diasNoMes).fill(null)

      for (const r of registros) {
        if (r.alunoId === aluno.id) {
          dias[r.data.getUTCDate() - 1] = r.presente ? "P" : "F"
        }
      }

      const presencas = dias.filter((d) => d === "P").length
      const faltas = dias.filter((d) => d === "F").length
      const total = presencas + faltas

      return {
        numero: indice + 1,
        id: aluno.id,
        matricula: aluno.matricula,
        nome: aluno.nome,
        dias,
        presencas,
        faltas,
        frequencia: total > 0 ? Math.round((presencas / total) * 100) : null,
      }
    })

    const totalPresencas = alunos.reduce((soma, a) => soma + a.presencas, 0)
    const totalFaltas = alunos.reduce((soma, a) => soma + a.faltas, 0)
    const totalRegistros = totalPresencas + totalFaltas

    res.status(200).json({
      turma: {
        id: turma.id,
        nome: turma.nome,
        turno: turma.turno,
        ano_letivo: turma.ano_letivo,
      },
      disciplina: {
        id: disciplina.id,
        nome: disciplina.nome,
        cargaHoraria: disciplina.cargaHoraria,
      },
      // Quem fez a chamada; se ainda não houver, usa o professor da disciplina
      professor: registros[0]?.funcionario.nome ?? disciplina.professorNome ?? null,
      mes,
      diasNoMes,
      diasComChamada,
      alunos,
      totais: {
        aulas: diasComChamada.length,
        presencas: totalPresencas,
        faltas: totalFaltas,
        frequenciaMedia:
          totalRegistros > 0 ? Math.round((totalPresencas / totalRegistros) * 100) : null,
      },
    })
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível gerar a exportação", detalhe: error })
  }
})

// POST /api/chamadas
// Salva a chamada do dia. Se já existir, substitui (permite corrigir).
router.post("/", async (req, res) => {
  const valida = chamadaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.flatten() })
    return
  }

  const { turmaId, disciplinaId, data, funcionarioId, presencas } = valida.data

  try {
    const [turma, disciplina, funcionario] = await Promise.all([
      prisma.turma.findUnique({ where: { id: turmaId }, include: { alunos: true } }),
      prisma.disciplina.findUnique({ where: { id: disciplinaId } }),
      prisma.funcionario.findUnique({ where: { id: funcionarioId } }),
    ])

    if (!turma) {
      res.status(404).json({ erro: "Turma não encontrada" })
      return
    }
    if (!disciplina) {
      res.status(404).json({ erro: "Disciplina não encontrada" })
      return
    }
    if (!funcionario) {
      res.status(404).json({ erro: "Professor(a) não encontrado(a)" })
      return
    }

    // Todos os alunos enviados precisam ser da turma
    const idsDaTurma = new Set(turma.alunos.map((a) => a.id))
    const alunoDeFora = presencas.find((p) => !idsDaTurma.has(p.alunoId))
    if (alunoDeFora) {
      res.status(400).json({ erro: `O aluno ${alunoDeFora.alunoId} não pertence a esta turma` })
      return
    }

    // Cria o vínculo Turma x Professor automaticamente, se ainda não existir
    const turmaProfessor = await prisma.turmaProfessor.upsert({
      where: { turmaId_funcionarioId: { turmaId, funcionarioId } },
      update: {},
      create: { turmaId, funcionarioId },
    })

    const dataChamada = toDate(data)

    // Transação: apaga a chamada antiga do dia (se houver) e grava a nova.
    // Se algo falhar no meio, nada é salvo.
    await prisma.$transaction([
      prisma.chamada.deleteMany({
        where: { turmaId, disciplinaId, data: dataChamada },
      }),
      prisma.chamada.createMany({
        data: presencas.map((p) => ({
          data: dataChamada,
          presente: p.presente,
          alunoId: p.alunoId,
          turmaId,
          disciplinaId,
          funcionarioId,
          turmaProfessorId: turmaProfessor.id,
        })),
      }),
    ])

    const presentes = presencas.filter((p) => p.presente).length

    // Resumo para o popup "Chamada registrada com sucesso!"
    res.status(201).json({
      data,
      turma: turma.nome,
      disciplina: disciplina.nome,
      presentes,
      ausentes: presencas.length - presentes,
    })
  } catch (error) {
    res.status(500).json({ erro: "Não foi possível salvar a chamada", detalhe: error })
  }
})

export default router
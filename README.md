<div align="center">

# 🎓 CON — Controle de Chamada Acadêmica

## Sobre

API REST do **CON**, sistema de controle de chamada acadêmica desenvolvido como
projeto da disciplina de Gestão Ágil (4º Semestre — ADS), simulando o cenário de
uma **EMEI** (Escola Municipal de Educação Infantil).

Gerencia alunos, turmas, salas, disciplinas, funcionários, o vínculo entre
professores e disciplinas por turma, o registro diário de chamada e a exportação
do diário de classe em PDF.

---

## Tecnologias

| Camada | Ferramenta |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework HTTP | Express |
| ORM | Prisma |
| Banco de dados | PostgreSQL (Neon) |
| Validação | Zod |

---

## Como rodar

```bash
# instalar dependências
npm install

# configurar variáveis de ambiente
cp .env.exemple .env
# edite o .env com sua DATABASE_URL (Postgres/Neon)

# aplicar as migrations
npx prisma migrate dev

# popular o banco com dados de teste
npx prisma db seed

# subir o servidor (porta 3001)
npm run dev
```

### Scripts úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | sobe a API em modo desenvolvimento |
| `npx prisma studio` | abre uma interface visual pra ver/editar os dados do banco |
| `npx prisma migrate dev` | aplica migrations pendentes |
| `npx prisma db seed` | recria os dados de teste |
| `npm test` | roda os testes |

---

## Modelo de dados — destaque

O vínculo entre **professor**, **disciplina** e **turma** fica na tabela
`turmas_professores`:

- Cada combinação **turma + disciplina** tem **um único** professor responsável.
- O **mesmo professor** pode lecionar a **mesma disciplina** em **turmas diferentes**.
- **Turmas diferentes** podem ter **professores diferentes** pra uma mesma disciplina
  (ex: duas professoras de Matemática, cada uma numa turma).

O vínculo é criado automaticamente na primeira chamada registrada por um professor
pra aquela turma/disciplina, ou manualmente pela tela de Turmas no painel admin.

---

## Principais rotas

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/login` | autenticação (admin ou professor) |
| `GET/POST/PUT/DELETE` | `/api/alunos` | CRUD de alunos |
| `GET/POST/PUT/DELETE` | `/api/turmas` | CRUD de turmas |
| `POST` | `/api/turmas/:turmaId/professores` | vincula professor + disciplina a uma turma |
| `DELETE` | `/api/turmas/:turmaId/professores/:vinculoId` | remove um vínculo |
| `GET/POST/PUT/DELETE` | `/api/salas` | CRUD de salas |
| `GET/POST/PUT/DELETE` | `/api/disciplinas` | CRUD de disciplinas |
| `GET/POST/PUT/DELETE` | `/api/funcionarios` | CRUD de funcionários |
| `GET` | `/api/chamadas` | consulta a chamada de um dia |
| `POST` | `/api/chamadas` | registra/corrige a chamada do dia |
| `GET` | `/api/chamadas/exportar` | dados do diário de classe (mês) |

---

## Usuário de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Direção (admin) | `direcao@con.local` | `Admin@123` |

> Crie um funcionário com cargo **"Professor"** pelo painel admin e vincule-o a
> uma turma/disciplina pra testar esse perfil.

---

<div align="center">
Projeto acadêmico — ADS, 4º Semestre, Gestão Ágil
</div>

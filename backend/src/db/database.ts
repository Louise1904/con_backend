import { Low } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tipos do banco de dados
export interface UserDB {
  id: number;
  email: string;
  senha: string;
  tipo: 'PROFESSOR' | 'ADM';
  nome: string;
}

export interface DisciplinaDB {
  id: number;
  nome: string;
  cargaHoraria: string;
  professorNome: string;
  sala: string;
  capacidade: number | null;
  descricao: string;
  createdAt: string;
  updatedAt: string;
}

interface DbSchema {
  users: UserDB[];
  disciplinas: DisciplinaDB[];
  _nextId: { users: number; disciplinas: number };
}

const dbPath = path.join(__dirname, '../../con_database.json');
const adapter = new JSONFileSync<DbSchema>(dbPath);
const db = new Low<DbSchema>(adapter, {
  users: [],
  disciplinas: [],
  _nextId: { users: 1, disciplinas: 1 },
});

// Carregar dados
db.read();

// Garantir estrutura padrão
if (!db.data.users) db.data.users = [];
if (!db.data.disciplinas) db.data.disciplinas = [];
if (!db.data._nextId) db.data._nextId = { users: 1, disciplinas: 1 };

// Inserir usuários padrão se não existirem
const usuariosPadrao: Omit<UserDB, 'id'>[] = [
  { email: 'professor@con.edu.br', senha: '123456', tipo: 'PROFESSOR', nome: 'Professor Padrão' },
  { email: 'admin@con.edu.br', senha: '123456', tipo: 'ADM', nome: 'Administrador' },
];

for (const u of usuariosPadrao) {
  const existe = db.data.users.find((x) => x.email === u.email);
  if (!existe) {
    db.data.users.push({ id: db.data._nextId.users++, ...u });
  }
}

db.write();

export default db;

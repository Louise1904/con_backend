export interface Disciplina {
  id?: number;
  nome: string;
  cargaHoraria: string;
  professorNome: string;
  sala: string;
  capacidade: number | string;
  descricao: string;
}

export interface User {
  id?: number;
  email: string;
  tipo: 'PROFESSOR' | 'ADM';
  nome?: string;
}

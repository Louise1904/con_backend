import { Request, Response } from 'express';
import db, { DisciplinaDB } from '../db/database.js';

export const listarDisciplinas = (_req: Request, res: Response): void => {
  db.read();
  const disciplinas = [...db.data.disciplinas].sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );
  res.json(disciplinas);
};

export const buscarDisciplina = (req: Request, res: Response): void => {
  db.read();
  const disciplina = db.data.disciplinas.find((d) => d.id === Number(req.params.id));

  if (!disciplina) {
    res.status(404).json({ message: 'Disciplina não encontrada.' });
    return;
  }

  res.json(disciplina);
};

export const criarDisciplina = (req: Request, res: Response): void => {
  const { nome, cargaHoraria, professorNome, sala, capacidade, descricao } = req.body;

  if (!nome) {
    res.status(400).json({ message: 'Nome da disciplina é obrigatório.' });
    return;
  }

  db.read();

  const nova: DisciplinaDB = {
    id: db.data._nextId.disciplinas++,
    nome,
    cargaHoraria: cargaHoraria || '',
    professorNome: professorNome || '',
    sala: sala || '',
    capacidade: capacidade ? Number(capacidade) : null,
    descricao: descricao || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.data.disciplinas.push(nova);
  db.write();

  res.status(201).json(nova);
};

export const atualizarDisciplina = (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  const { nome, cargaHoraria, professorNome, sala, capacidade, descricao } = req.body;

  db.read();
  const index = db.data.disciplinas.findIndex((d) => d.id === id);

  if (index === -1) {
    res.status(404).json({ message: 'Disciplina não encontrada.' });
    return;
  }

  db.data.disciplinas[index] = {
    ...db.data.disciplinas[index],
    nome: nome ?? db.data.disciplinas[index].nome,
    cargaHoraria: cargaHoraria ?? db.data.disciplinas[index].cargaHoraria,
    professorNome: professorNome ?? db.data.disciplinas[index].professorNome,
    sala: sala ?? db.data.disciplinas[index].sala,
    capacidade: capacidade != null ? Number(capacidade) : db.data.disciplinas[index].capacidade,
    descricao: descricao ?? db.data.disciplinas[index].descricao,
    updatedAt: new Date().toISOString(),
  };

  db.write();
  res.json(db.data.disciplinas[index]);
};

export const excluirDisciplina = (req: Request, res: Response): void => {
  const id = Number(req.params.id);

  db.read();
  const index = db.data.disciplinas.findIndex((d) => d.id === id);

  if (index === -1) {
    res.status(404).json({ message: 'Disciplina não encontrada.' });
    return;
  }

  db.data.disciplinas.splice(index, 1);
  db.write();

  res.status(204).send();
};

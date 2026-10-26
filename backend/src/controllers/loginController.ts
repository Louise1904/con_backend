import { Request, Response } from 'express';
import db from '../db/database.js';

export const loginHandler = (req: Request, res: Response): void => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    return;
  }

  db.read();
  const user = db.data.users.find((u) => u.email === email && u.senha === senha);

  if (!user) {
    res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    return;
  }

  res.json({
    message: 'Login realizado com sucesso!',
    user: {
      id: user.id,
      email: user.email,
      tipo: user.tipo,
      nome: user.nome,
    },
  });
};

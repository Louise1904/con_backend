import { Router } from 'express';
import {
  listarDisciplinas,
  buscarDisciplina,
  criarDisciplina,
  atualizarDisciplina,
  excluirDisciplina,
} from '../controllers/disciplinasController.js';

const router = Router();

router.get('/disciplinas', listarDisciplinas);
router.get('/disciplinas/:id', buscarDisciplina);
router.post('/disciplinas', criarDisciplina);
router.put('/disciplinas/:id', atualizarDisciplina);
router.delete('/disciplinas/:id', excluirDisciplina);

export default router;

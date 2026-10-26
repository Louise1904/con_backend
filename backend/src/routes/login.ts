import { Router } from 'express';
import { loginHandler } from '../controllers/loginController.js';

const router = Router();

router.post('/login', loginHandler);

export default router;

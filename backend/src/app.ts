import express from 'express';
import cors from 'cors';
import loginRoutes from './routes/login.js';
import disciplinasRoutes from './routes/disciplinas.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', loginRoutes);
app.use('/api', disciplinasRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'CON Backend funcionando!' });
});

export default app;

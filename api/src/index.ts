import express from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { authRouter } from './modules/auth/auth.routes';
import { citiesRouter } from './modules/cities/cities.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Part 11 — CORS locked to one known origin, not '*'
app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/cities', citiesRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Lemenbado API listening on http://localhost:${env.port}`);
});
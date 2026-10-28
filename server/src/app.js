import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import executionRoutes from './routes/execution.js';
import progressRoutes from './routes/progress.js';
import { fail } from './utils/http.js';

const limiter = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { message } } });

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.frontendOrigin, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use('/api', limiter(60_000, 120, 'Too many requests'));
  const execLimit = limiter(60_000, 20, 'Too many execution requests');
  const authLimit = limiter(15 * 60_000, 30, 'Too many attempts');

  app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.use(['/api/auth/login', '/api/auth/register'], authLimit);
  app.use('/api/auth', authRoutes);
  app.use('/api/questions', questionRoutes);
  app.use(['/api/run', '/api/submissions'], (req, res, next) => (req.method === 'POST' ? execLimit(req, res, next) : next()));
  app.use('/api', executionRoutes);
  app.use('/api', progressRoutes);

  app.use('/api', (_req, res) => fail(res, 404, 'Route not found'));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ZodError) return fail(res, 400, 'Validation failed', err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
    if (err.type === 'entity.too.large') return fail(res, 413, 'Request too large');
    if (err.type === 'entity.parse.failed') return fail(res, 400, 'Malformed JSON');
    console.error(err);
    return fail(res, err.status || 500, err.status ? err.message : 'Internal server error');
  });
  return app;
}

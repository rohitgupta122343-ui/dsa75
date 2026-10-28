import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Question from '../models/Question.js';
import Submission from '../models/Submission.js';
import DailyProgress from '../models/DailyProgress.js';
import { requireAuth } from '../middleware/auth.js';
import { execute, ExecError } from '../services/executor.js';
import { evaluate } from '../services/evaluator.js';
import { getChallenge } from '../services/stats.js';
import { dayKeyFor } from '../utils/dates.js';
import { ok, fail, asyncHandler } from '../utils/http.js';

const r = Router();
r.use(requireAuth);
const lang = z.enum(['javascript', 'python', 'c', 'cpp']);
const code = z.string().min(1).max(65536);
const oid = z.string().refine(mongoose.isValidObjectId, 'Invalid id');
const execFail = (res, e) => (e instanceof ExecError ? fail(res, e.status, e.message, { code: e.code }) : null);

// Run: sample/custom input only. No verdict, never touches progress.
r.post('/run', asyncHandler(async (req, res) => {
  const body = z.object({ language: lang, code, input: z.string().max(10000).default('') }).strict().parse(req.body);
  try {
    const out = await execute({ language: body.language, code: body.code, stdin: body.input });
    ok(res, { result: { ...out, stdout: out.stdout.slice(0, 20000), stderr: out.stderr.slice(0, 20000) } });
  } catch (e) { if (!execFail(res, e)) throw e; }
}));

// Submit: full evaluation (samples + hidden). Hidden test data is never returned.
r.post('/submissions', asyncHandler(async (req, res) => {
  const body = z.object({ questionId: oid, language: lang, code }).strict().parse(req.body);
  const filter = { _id: body.questionId };
  if (req.user.role !== 'admin') filter.published = true;
  const question = await Question.findOne(filter).lean();
  if (!question) return fail(res, 404, 'Question not found');
  let result;
  try { result = await evaluate({ question, language: body.language, code: body.code }); }
  catch (e) { if (execFail(res, e)) return; throw e; }

  const ch = await getChallenge();
  const now = new Date();
  const dayKey = dayKeyFor(now, ch.timezone);
  const sub = await Submission.create({
    user: req.user._id, question: question._id, language: body.language, code: body.code,
    verdict: result.verdict, passed: result.passed, total: result.total, timeMs: result.timeMs, memoryKb: result.memoryKb,
    stderr: result.stderr, compileOutput: result.compileOutput, dayKey,
  });
  let firstSolve = false;
  if (result.verdict === 'accepted') {
    try {
      const up = await DailyProgress.updateOne(
        { user: req.user._id, question: question._id },
        { $setOnInsert: { dayKey, solvedAt: now, submission: sub._id } },
        { upsert: true },
      );
      firstSolve = up.upsertedCount === 1;
    } catch (e) { if (e.code !== 11000) throw e; } // concurrent duplicate accept: already counted
  }
  ok(res, { submission: sub, failedCase: result.failedCase ?? null, firstSolve }, 201);
}));

r.get('/submissions', asyncHandler(async (req, res) => {
  const q = z.object({ question: oid.optional(), verdict: z.string().max(40).optional(), user: oid.optional(),
    page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20) }).parse(req.query);
  const filter = { user: req.user.role === 'admin' && q.user ? q.user : req.user._id }; // only the admin may browse another user's submissions
  if (q.question) filter.question = q.question;
  if (q.verdict) filter.verdict = q.verdict;
  const [items, total] = await Promise.all([
    Submission.find(filter).select('-code').sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate('question', 'title slug day difficulty').lean(),
    Submission.countDocuments(filter),
  ]);
  ok(res, { submissions: items, total, page: q.page });
}));

r.get('/submissions/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Invalid id');
  const sub = await Submission.findById(req.params.id).populate('question', 'title slug day difficulty').lean();
  if (!sub || (String(sub.user) !== String(req.user._id) && req.user.role !== 'admin')) return fail(res, 404, 'Submission not found');
  ok(res, { submission: sub });
}));
export default r;

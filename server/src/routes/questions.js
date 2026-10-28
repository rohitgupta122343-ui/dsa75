import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Question, { TOPICS } from '../models/Question.js';
import DailyProgress from '../models/DailyProgress.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ok, fail, asyncHandler } from '../utils/http.js';

const r = Router();
r.use(requireAuth);

const tc = z.object({ input: z.string().max(20000).default(''), expectedOutput: z.string().max(20000) });
const base = z.object({
  title: z.string().trim().min(3).max(140),
  statement: z.string().min(10).max(20000),
  topic: z.enum(TOPICS), difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  day: z.number().int().min(1).max(75),
  constraints: z.string().max(5000).optional(), inputFormat: z.string().max(5000).optional(),
  outputFormat: z.string().max(5000).optional(), sampleInput: z.string().max(5000).optional(),
  sampleOutput: z.string().max(5000).optional(), explanation: z.string().max(10000).optional(),
  starterCode: z.object({ javascript: z.string().max(20000), python: z.string().max(20000), c: z.string().max(20000), cpp: z.string().max(20000) }).partial().optional(),
  sampleTests: z.array(tc).max(10).default([]),
  hiddenTests: z.array(tc).max(100).default([]),
  published: z.boolean().default(false),
}).strict();

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const byIdOrSlug = (p) => (mongoose.isValidObjectId(p) ? { $or: [{ _id: p }, { slug: p }] } : { slug: p });

r.get('/', asyncHandler(async (req, res) => {
  const q = z.object({ q: z.string().max(100).optional(), topic: z.enum(TOPICS).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(), day: z.coerce.number().int().min(1).max(75).optional() }).parse(req.query);
  const filter = {};
  if (req.user.role !== 'admin') filter.published = true;
  if (q.topic) filter.topic = q.topic;
  if (q.difficulty) filter.difficulty = q.difficulty;
  if (q.day) filter.day = q.day;
  if (q.q) filter.title = { $regex: esc(q.q), $options: 'i' };
  const items = await Question.find(filter).select('title slug topic difficulty day published').sort({ day: 1, createdAt: 1 }).lean();
  const solved = new Set((await DailyProgress.find({ user: req.user._id }).select('question').lean()).map((d) => String(d.question)));
  ok(res, { questions: items.map((x) => ({ ...x, solved: solved.has(String(x._id)) })) });
}));

// Admin-only full view (includes hidden tests).
r.get('/admin/:id/full', requireAdmin, asyncHandler(async (req, res) => {
  const qn = await Question.findOne(byIdOrSlug(req.params.id)).lean();
  return qn ? ok(res, { question: qn }) : fail(res, 404, 'Question not found');
}));

r.get('/:slug', asyncHandler(async (req, res) => {
  const filter = { ...byIdOrSlug(req.params.slug) };
  if (req.user.role !== 'admin') filter.published = true;
  const qn = await Question.findOne(filter).select('-hiddenTests').lean(); // hidden tests never leave the server here
  return qn ? ok(res, { question: qn }) : fail(res, 404, 'Question not found');
}));

r.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const body = base.parse(req.body);
  try { ok(res, { question: await Question.create({ ...body, slug: slugify(body.title) }) }, 201); }
  catch (e) { if (e.code === 11000) return fail(res, 409, 'A question with this title already exists'); throw e; }
}));

r.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Invalid id');
  const body = base.partial().parse(req.body);
  const qn = await Question.findById(req.params.id);
  if (!qn) return fail(res, 404, 'Question not found');
  Object.assign(qn, body);
  if (body.title) qn.slug = slugify(body.title);
  try { await qn.save(); ok(res, { question: qn }); }
  catch (e) { if (e.code === 11000) return fail(res, 409, 'A question with this title already exists'); throw e; }
}));

r.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Invalid id');
  const del = await Question.findByIdAndDelete(req.params.id);
  return del ? ok(res, { deleted: true }) : fail(res, 404, 'Question not found');
}));
export default r;

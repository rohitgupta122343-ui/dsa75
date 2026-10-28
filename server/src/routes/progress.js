import { Router } from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import { getChallenge, currentDay, buildCalendarFor, buildStatsFor, buildLeaderboard } from '../services/stats.js';
import User from '../models/User.js';
import DailyProgress from '../models/DailyProgress.js';
import { ok, fail, asyncHandler } from '../utils/http.js';

const r = Router();
r.use(requireAuth);

r.get('/challenge', asyncHandler(async (_req, res) => {
  const ch = await getChallenge();
  ok(res, { challenge: { startDate: ch.startDate, timezone: ch.timezone, totalDays: ch.totalDays }, ...currentDay(ch) });
}));

// Both participants may view each other's progress (read-only). ':userId' may be 'me'.
const target = asyncHandler(async (req, res, next) => {
  const id = req.params.userId === 'me' ? String(req.user._id) : req.params.userId;
  if (!mongoose.isValidObjectId(id) || !(await User.exists({ _id: id }))) return fail(res, 404, 'User not found');
  req.targetId = id; next();
});
r.get('/progress/:userId/calendar', target, asyncHandler(async (req, res) => ok(res, await buildCalendarFor(req.targetId))));
r.get('/progress/:userId/stats', target, asyncHandler(async (req, res) => ok(res, { stats: await buildStatsFor(req.targetId) })));
// Accepted questions for one calendar day (powers the calendar's click-through panel).
r.get('/progress/:userId/day/:dayKey', target, asyncHandler(async (req, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.dayKey)) return fail(res, 400, 'Invalid date');
  const rows = await DailyProgress.find({ user: req.targetId, dayKey: req.params.dayKey })
    .populate('question', 'title slug difficulty topic').sort({ solvedAt: 1 }).lean();
  ok(res, { accepted: rows.filter((x) => x.question).map((x) => ({ ...x.question, solvedAt: x.solvedAt })) });
}));
r.get('/leaderboard', asyncHandler(async (_req, res) => ok(res, { leaderboard: await buildLeaderboard() })));
r.get('/participants', asyncHandler(async (_req, res) => ok(res, { users: await User.find().select('username role').lean() })));
export default r;

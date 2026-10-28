import mongoose from 'mongoose';
import Challenge from '../models/Challenge.js';
import DailyProgress from '../models/DailyProgress.js';
import Submission from '../models/Submission.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { dayKeyFor, diffDays } from '../utils/dates.js';
import { computeStreaks, buildCalendar } from './progress.js';

export async function getChallenge() {
  const ch = await Challenge.findOne({ key: 'main' }).lean();
  if (!ch) throw Object.assign(new Error('Challenge not initialised. Run `npm run setup`.'), { status: 503 });
  return ch;
}

export function currentDay(ch) {
  const todayKey = dayKeyFor(new Date(), ch.timezone);
  const n = diffDays(ch.startDate, todayKey) + 1;
  return { todayKey, day: Math.min(Math.max(n, 0), ch.totalDays), started: n >= 1, finished: n > ch.totalDays };
}

export async function buildCalendarFor(userId) {
  const ch = await getChallenge();
  const { todayKey } = currentDay(ch);
  const uid = new mongoose.Types.ObjectId(userId);
  const [solved, subs] = await Promise.all([
    DailyProgress.aggregate([{ $match: { user: uid } }, { $group: { _id: '$dayKey', n: { $sum: 1 } } }]),
    Submission.aggregate([{ $match: { user: uid } }, { $group: { _id: '$dayKey', n: { $sum: 1 } } }]),
  ]);
  const solvedByDay = new Map(solved.map((x) => [x._id, x.n]));
  const subsByDay = new Map(subs.map((x) => [x._id, x.n]));
  const cal = buildCalendar({ startKey: ch.startDate, totalDays: ch.totalDays, todayKey, solvedByDay, subsByDay });
  return { ...cal, streaks: computeStreaks([...solvedByDay.keys()], todayKey), activeDays: solvedByDay.size, todayKey };
}

export async function buildStatsFor(userId) {
  const ch = await getChallenge();
  const cal = await buildCalendarFor(userId);
  const rows = await DailyProgress.find({ user: userId }).populate('question', 'difficulty topic').lean();
  const valid = rows.filter((x) => x.question);
  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  const byTopic = {};
  for (const x of valid) { byDifficulty[x.question.difficulty]++; byTopic[x.question.topic] = (byTopic[x.question.topic] || 0) + 1; }
  const topicTotals = await Question.aggregate([{ $match: { published: true } }, { $group: { _id: '$topic', total: { $sum: 1 } } }]);
  const topics = topicTotals.map((t) => ({ topic: t._id, total: t.total, solved: byTopic[t._id] || 0 })).sort((a, b) => a.topic.localeCompare(b.topic));
  const todaySolved = cal.days.find((d) => d.date === cal.todayKey)?.solved || 0;
  return {
    totalSolved: valid.length, totalQuestions: topics.reduce((s, t) => s + t.total, 0), byDifficulty, topics,
    completedDays: cal.summary.completed, missedDays: cal.summary.missed,
    completionPct: Math.round((cal.summary.completed / ch.totalDays) * 100),
    currentStreak: cal.streaks.current, longestStreak: cal.streaks.longest, activeDays: cal.activeDays,
    todaySolved, dailyGoalMet: todaySolved > 0, // goal = at least one Accepted solve today
  };
}

export async function buildLeaderboard() {
  const users = await User.find().select('username role').lean();
  const rows = await Promise.all(users.map(async (u) => ({ user: u, ...(await buildStatsFor(u._id)) })));
  // Ranking: total accepted desc, then current streak desc, then longest streak desc. Equal on all three = tied.
  rows.sort((a, b) => b.totalSolved - a.totalSolved || b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak);
  const keys = ['totalSolved', 'currentStreak', 'longestStreak'];
  return rows.map((r, i, arr) => ({ ...r, rank: i > 0 && keys.every((k) => arr[i - 1][k] === r[k]) ? arr[i - 1].rank : i + 1 }));
}

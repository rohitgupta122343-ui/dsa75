import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from '../models/User.js';
import { COOKIE, cookieOptions, signToken, requireAuth } from '../middleware/auth.js';
import { ok, fail, asyncHandler } from '../utils/http.js';

const r = Router();
const reg = z.object({
  username: z.string().trim().min(3).max(30),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
}).strict();

// Duo platform: the admin is created by `npm run setup`; exactly one normal user may register.
r.post('/register', asyncHandler(async (req, res) => {
  const body = reg.parse(req.body); // a role is never accepted from the client
  if (await User.countDocuments({ role: 'user' }) >= 1) return fail(res, 403, 'Registration is closed: both participants already exist.');
  try {
    const user = await User.create({ ...body, passwordHash: await bcrypt.hash(body.password, 12), role: 'user' });
    res.cookie(COOKIE, signToken(user), cookieOptions());
    ok(res, { user }, 201);
  } catch (e) {
    if (e.code === 11000) return fail(res, 409, 'Username or email already in use');
    throw e;
  }
}));

r.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(128) }).parse(req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return fail(res, 401, 'Invalid email or password');
  res.cookie(COOKIE, signToken(user), cookieOptions());
  ok(res, { user });
}));

r.post('/logout', (_req, res) => { res.clearCookie(COOKIE, { ...cookieOptions(), maxAge: undefined }); ok(res); });
r.get('/me', requireAuth, (req, res) => ok(res, { user: req.user }));
r.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({
    theme: z.enum(['dark', 'light']), preferredLanguage: z.enum(['javascript', 'python', 'c', 'cpp']),
  }).partial().strict().parse(req.body);
  Object.assign(req.user, body);
  await req.user.save();
  ok(res, { user: req.user });
}));
export default r;

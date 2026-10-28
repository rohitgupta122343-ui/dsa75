import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';
import { fail } from '../utils/http.js';

export const COOKIE = 'dsa75_token';
export const cookieOptions = () => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: config.isProd ? 'none' : 'lax', // 'none' needed when the Vercel frontend and API are on different sites
  maxAge: 7 * 24 * 3600 * 1000,
  path: '/',
});
export const signToken = (user) => jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return fail(res, 401, 'Not authenticated');
    const { sub } = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(sub); // role always comes from the database
    if (!user) return fail(res, 401, 'Not authenticated');
    req.user = user;
    next();
  } catch { fail(res, 401, 'Invalid or expired session'); }
}
export const requireAdmin = (req, res, next) => (req.user?.role === 'admin' ? next() : fail(res, 403, 'Admin access required'));

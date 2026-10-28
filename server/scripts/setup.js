// One-time setup: creates the Admin (from env vars, never from the client) and the Challenge window.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../src/config.js';
import User from '../src/models/User.js';
import Challenge from '../src/models/Challenge.js';

const { ADMIN_USERNAME: username, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
await mongoose.connect(config.mongoUri);
await Promise.all([User.init(), Challenge.init()]);

if (await User.exists({ role: 'admin' })) console.log('Admin already exists, skipping.');
else {
  if (!username || !email || !password || password.length < 12) throw new Error('Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars) in .env');
  await User.create({ username, email, passwordHash: await bcrypt.hash(password, 12), role: 'admin' });
  console.log('Admin created. Remove ADMIN_PASSWORD from .env now.');
}
if (await Challenge.exists({ key: 'main' })) console.log('Challenge already initialised.');
else {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(config.challenge.startDate || '')) throw new Error('Set CHALLENGE_START_DATE=YYYY-MM-DD');
  await Challenge.create({ startDate: config.challenge.startDate, timezone: config.challenge.timezone, totalDays: 75 });
  console.log('Challenge initialised.');
}
await mongoose.disconnect();

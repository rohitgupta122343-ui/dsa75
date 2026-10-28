import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

export const config = {
  isProd,
  port: Number(process.env.PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  mongoUri: required('MONGODB_URI'),
  jwtSecret,
  challenge: {
    startDate: process.env.CHALLENGE_START_DATE,
    timezone: process.env.CHALLENGE_TIMEZONE || 'UTC',
  },
  judge0: {
    url: (process.env.JUDGE0_API_URL || '').replace(/\/$/, ''),
    apiKey: process.env.JUDGE0_API_KEY || '',
    authHeader: process.env.JUDGE0_AUTH_HEADER || 'X-Auth-Token',
    apiHost: process.env.JUDGE0_API_HOST || '',
  },
};

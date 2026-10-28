# 75 Days DSA Challenge — Backend (Stage 1–6)

Express + MongoDB API: auth, roles, question management, Judge0 execution/evaluation,
submissions, daily progress, calendar, stats and leaderboard.

## Setup
```bash
cd server
cp .env.example .env     # fill MONGODB_URI, JWT_SECRET, JUDGE0_*, ADMIN_*, CHALLENGE_START_DATE
npm install
npm run setup            # creates Admin + challenge window (then delete ADMIN_PASSWORD from .env)
npm run seed             # 2 sample questions
npm run dev
npm test                 # pure-logic tests (streaks, calendar, timezone, output compare)
```

## Judge0
Set `JUDGE0_API_URL`. Self-hosted uses `X-Auth-Token` (optional). RapidAPI: URL
`https://judge0-ce.p.rapidapi.com`, `JUDGE0_AUTH_HEADER=X-RapidAPI-Key`, `JUDGE0_API_HOST=judge0-ce.p.rapidapi.com`.
Without it, run/submit return `503 NOT_CONFIGURED` (no fake results). Swap providers in `src/services/executor.js`.

## Rules
- Solved = first Accepted per (user, question): unique index on `DailyProgress`.
- Day is green only if an accept happened on that day (challenge timezone); missed days never backfill.
- Leaderboard: total accepted, then current streak, then longest streak; equal on all three = tied.
- Hidden tests are never returned except to Admin via `GET /api/questions/admin/:id/full`.

## API (all under /api, JSON `{success, data|error}`)
auth: POST register|login|logout, GET/PATCH me · questions: GET /, GET /:slug, admin POST/PUT/DELETE
· POST /run, POST|GET /submissions, GET /submissions/:id · GET /challenge, /progress/:userId|me/calendar|stats, /leaderboard

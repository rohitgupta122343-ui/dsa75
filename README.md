# 75 Days DSA Challenge — Duo Coding Platform

Two people, 75 days, real code execution. One Admin manages questions; one participant registers; both solve in
JavaScript, Python, C or C++ and see each other's calendar, streaks and leaderboard.

```
server/   Express + MongoDB API (auth, roles, questions, Judge0 evaluation, progress)
client/   React + Vite + Tailwind app (Monaco editor, calendar, dashboard, admin CRUD)
```

## Local development

Requirements: Node 20+, a MongoDB instance (local or Atlas), a Judge0 endpoint for running code.

```bash
# 1. API
cd server
cp .env.example .env        # fill MONGODB_URI, JWT_SECRET (>=32 chars), JUDGE0_*, ADMIN_*, CHALLENGE_START_DATE
npm install
npm run setup               # creates the Admin + the 75-day window; then delete ADMIN_PASSWORD from .env
npm run seed                # optional: 2 sample questions (Day 1, Day 2)
npm run dev                 # http://localhost:5000
npm test                    # pure-logic tests (streaks, calendar, timezone, output compare)

# 2. Web app (second terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:5173
npm run build               # production build into client/dist
```

The first participant registers on `/register` (only one non-admin account is allowed). The Admin logs in with the
credentials from `.env` at setup time.

## Configuration

**MongoDB** — `MONGODB_URI`. Atlas works; allow your backend host's IP. Indexes are built on start.

**Judge0** — `JUDGE0_API_URL`.
- Self-hosted: URL of your instance, optional `JUDGE0_API_KEY` sent in `JUDGE0_AUTH_HEADER` (default `X-Auth-Token`).
- RapidAPI: `JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com`, `JUDGE0_AUTH_HEADER=X-RapidAPI-Key`,
  `JUDGE0_API_HOST=judge0-ce.p.rapidapi.com`, plus your key.
- Not configured? Run/Submit show a clear "Code execution is not set up" message. Nothing is faked.

**CORS and cookies** — `FRONTEND_ORIGIN` must exactly equal the browser origin of the web app (scheme + host + port,
no trailing slash). The session is an HTTP-only cookie. In production (`NODE_ENV=production`) it is `Secure` and
`SameSite=None`, so both the app and the API must be on HTTPS. Browsers increasingly block third-party cookies, so
prefer custom domains under one parent, e.g. `app.example.com` and `api.example.com`.

**Challenge window** — `CHALLENGE_START_DATE` (YYYY-MM-DD) and `CHALLENGE_TIMEZONE` (IANA name, default UTC) are read
once by `npm run setup`. Every submission is stamped with its calendar day in that timezone.

## Deployment

**Backend (Render, Railway, Fly.io or any Node host)**
1. Root directory `server`, build `npm install`, start `npm start`.
2. Set env vars from `server/.env.example` with `NODE_ENV=production` and `FRONTEND_ORIGIN=https://<your web app>`.
3. Run `npm run setup` once against the production database (shell/one-off job), then remove `ADMIN_PASSWORD`.
4. Check `GET /api/health` returns `{"success":true,...}`.

**Frontend (Vercel)**
1. Import the repo, set Root Directory to `client`, framework preset Vite (build `npm run build`, output `dist`).
2. Add `VITE_API_URL=https://<your API>` (no trailing slash, no `/api`). Redeploy after changing it.
3. `client/vercel.json` already rewrites all paths to `index.html` for client-side routing.

## API additions made for the UI
`GET /api/progress/:userId/day/:dayKey` returns the questions accepted on one calendar day. The calendar's click-through
panel uses it because the existing calendar endpoint only returns counts. Everything else uses the original routes.

## Final verification checklist
- [ ] `GET /api/health` is ok; `npm test` passes in `server/`; `npm run build` passes in `client/`
- [ ] Browser console is clean on every page (also check the network tab: all calls go to `VITE_API_URL`)
- [ ] Register the partner; log out and in again; refresh keeps the session; logout clears it
- [ ] Partner opening `/admin` is redirected, and `POST /api/questions` as the partner returns 403
- [ ] Admin creates a question with samples + hidden tests, publishes it, edits it, unpublishes, deletes (confirm dialog)
- [ ] Partner never sees hidden tests: `GET /api/questions/<slug>` has no `hiddenTests`
- [ ] Run shows real stdout for a sample and for custom input; Run does not change progress
- [ ] Compile error (C/C++), runtime error, infinite loop (time limit) and wrong answer each show the right verdict
- [ ] Submitting a correct solution gives Accepted and turns today's square green on that user's calendar only
- [ ] Submitting the same solved question again leaves "Accepted questions" and the leaderboard total unchanged
- [ ] Stop Judge0 or unset `JUDGE0_API_URL`: Run/Submit show the unavailable/not-set-up message
- [ ] Stop the API: pages show "Cannot reach the API" with a Try again button
- [ ] Streak and "missed" days look right across midnight in `CHALLENGE_TIMEZONE`
- [ ] Dashboard, calendar, leaderboard and mobile navigation work at 375px width

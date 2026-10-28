import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import CompareTable from '../components/CompareTable.jsx';
import { Empty, ErrorState, PageHeader, ProgressBar, Skeleton } from '../components/ui.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const r = useAsync(() => api.get('/leaderboard'), []);
  if (r.error) return <ErrorState error={r.error} onRetry={r.reload} />;
  const rows = r.data?.leaderboard || [];
  return (
    <>
      <PageHeader title="Duo leaderboard" subtitle="Ranked by accepted questions, then current streak, then longest streak. Resubmitting a solved question never adds to the total." />
      {r.loading ? <Skeleton className="h-64" /> : !rows.length ? <div className="card"><Empty title="No participants yet" /></div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((p) => (
              <section key={p.user._id} className={`card p-5 ${p.rank === 1 ? 'border-accent/50' : ''}`} aria-label={p.user.username}>
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold">{p.rank === 1 && <Trophy className="h-5 w-5 text-warn" aria-label="Rank 1" />}{p.user.username}{p.user._id === user._id && <span className="text-sm font-normal text-mute">(you)</span>}</h2>
                  <span className="text-2xl font-bold tabular-nums text-accent">#{p.rank}</span>
                </div>
                <p className="mt-3 text-3xl font-bold tabular-nums">{p.totalSolved}<span className="ml-2 text-sm font-normal text-mute">accepted</span></p>
                <div className="mt-3"><ProgressBar value={p.completedDays} max={75} label={`${p.user.username} completion`} /></div>
                <p className="mt-1 text-xs text-mute">{p.completedDays} of 75 days · {p.currentStreak} day streak</p>
              </section>
            ))}
          </div>
          <section className="card mt-6 p-5">
            <h2 className="mb-3 text-lg font-bold">Head to head</h2>
            <CompareTable people={rows.map((p) => ({ name: p.user.username, stats: p, isYou: p.user._id === user._id, rank: p.rank }))} />
          </section>
        </>
      )}
    </>
  );
}

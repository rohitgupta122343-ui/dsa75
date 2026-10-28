import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { fmtDate } from '../lib/format.js';
import Calendar, { CalendarSkeleton } from '../components/Calendar.jsx';
import { ErrorState, PageHeader, Stat } from '../components/ui.jsx';

export default function Challenge() {
  const { user } = useAuth();
  const ch = useAsync(() => api.get('/challenge'), []);
  const parts = useAsync(() => api.get('/participants'), []);
  const [who, setWho] = useState(user._id);
  const cal = useAsync(() => api.get(`/progress/${who}/calendar`), [who]);
  const name = parts.data?.users.find((u) => u._id === who)?.username || user.username;

  if (ch.error) return <ErrorState error={ch.error} onRetry={ch.reload} />;
  return (
    <>
      <PageHeader title="75-day calendar"
        subtitle={ch.data ? `Started ${fmtDate(`${ch.data.challenge.startDate}T00:00:00Z`)} · ${ch.data.started ? `today is Day ${ch.data.day}` : 'not started yet'} · times use ${ch.data.challenge.timezone}` : ' '}
        actions={parts.data?.users.map((u) => (
          <button key={u._id} onClick={() => setWho(u._id)} aria-pressed={who === u._id} className={who === u._id ? 'btn-primary' : 'btn-ghost'}>{u._id === user._id ? 'You' : u.username}</button>
        ))} />
      {cal.error ? <ErrorState error={cal.error} onRetry={cal.reload} /> : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Completed days" value={cal.data?.summary.completed ?? '–'} />
            <Stat label="Missed days" value={cal.data?.summary.missed ?? '–'} />
            <Stat label="Pending days" value={cal.data?.summary.pending ?? '–'} />
            <Stat label="Current streak" value={cal.data?.streaks.current ?? '–'} />
            <Stat label="Longest streak" value={cal.data?.streaks.longest ?? '–'} />
          </div>
          <section className="card p-5" aria-label={`${name}'s calendar`}>
            <h2 className="mb-4 text-lg font-bold">{who === user._id ? 'Your' : `${name}'s`} progress</h2>
            {cal.loading || !cal.data ? <CalendarSkeleton /> : <Calendar key={who} cal={cal.data} userId={who} />}
          </section>
        </>
      )}
    </>
  );
}

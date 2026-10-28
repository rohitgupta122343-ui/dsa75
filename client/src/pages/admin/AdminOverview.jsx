import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { ago } from '../../lib/format.js';
import { Empty, ErrorState, PageHeader, Skeleton, Stat, VerdictBadge } from '../../components/ui.jsx';

function Participant({ u }) {
  const stats = useAsync(() => api.get(`/progress/${u._id}/stats`), [u._id]);
  const subs = useAsync(() => api.get('/submissions', { params: { user: u._id, limit: 5 } }), [u._id]);
  const s = stats.data?.stats;
  return (
    <section className="card p-5" aria-label={u.username}>
      <h2 className="text-lg font-bold">{u.username} <span className="text-sm font-normal text-mute">{u.role === 'admin' ? 'Admin' : 'Participant'}</span></h2>
      {stats.error ? <ErrorState error={stats.error} onRetry={stats.reload} /> : !s ? <Skeleton className="mt-3 h-16" /> : (
        <p className="mt-2 text-sm text-mute"><b className="text-fg">{s.totalSolved}</b> accepted · <b className="text-fg">{s.completedDays}</b> days · streak <b className="text-fg">{s.currentStreak}</b> (best {s.longestStreak}) · {s.completionPct}% complete</p>
      )}
      <h3 className="mb-2 mt-4 text-sm font-semibold">Recent submissions</h3>
      {subs.loading ? <Skeleton className="h-16" /> : subs.error ? <p className="text-sm text-bad">{subs.error.message}</p> : !subs.data.submissions.length ? <p className="text-sm text-mute">Nothing submitted yet.</p> : (
        <ul className="space-y-1.5 text-sm">{subs.data.submissions.map((x) => <li key={x._id} className="flex items-center justify-between gap-2"><Link to={`/submissions/${x._id}`} className="truncate hover:text-accent">{x.question?.title || 'Removed question'}</Link><span className="flex shrink-0 items-center gap-2"><VerdictBadge verdict={x.verdict} /><span className="text-xs text-mute">{ago(x.createdAt)}</span></span></li>)}</ul>
      )}
    </section>
  );
}

export default function AdminOverview() {
  const parts = useAsync(() => api.get('/participants'), []);
  const qs = useAsync(() => api.get('/questions'), []);
  const all = qs.data?.questions || [];
  const published = all.filter((q) => q.published);
  const covered = new Set(published.map((q) => q.day)).size;
  return (
    <>
      <PageHeader title="Admin overview" subtitle="Questions and both participants at a glance." actions={<><Link to="/admin/questions" className="btn-ghost">Manage questions</Link><Link to="/admin/questions/new" className="btn-primary">New question</Link></>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {qs.loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />) : qs.error ? <div className="col-span-full"><ErrorState error={qs.error} onRetry={qs.reload} /></div> : (
          <><Stat label="Questions" value={all.length} /><Stat label="Published" value={published.length} /><Stat label="Drafts" value={all.length - published.length} /><Stat label="Days with a question" value={`${covered}/75`} /></>
        )}
      </div>
      {parts.error ? <ErrorState error={parts.error} onRetry={parts.reload} /> : parts.loading ? <Skeleton className="h-48" /> : !parts.data.users.length ? <div className="card"><Empty title="No participants" /></div> : (
        <div className="grid gap-6 lg:grid-cols-2">{parts.data.users.map((u) => <Participant key={u._id} u={u} />)}</div>
      )}
    </>
  );
}

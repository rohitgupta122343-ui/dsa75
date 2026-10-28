import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { DIFFICULTIES, TOPICS } from '../lib/format.js';
import { Badge, DifficultyBadge, Empty, ErrorState, PageHeader, Skeleton } from '../components/ui.jsx';

export default function Problems() {
  const { isAdmin } = useAuth();
  const [f, setF] = useState({ q: '', topic: '', difficulty: '', day: '' });
  const ch = useAsync(() => api.get('/challenge').catch(() => null), []);
  const list = useAsync(() => api.get('/questions', { params: Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }), [f.q, f.topic, f.difficulty, f.day]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const byDay = {};
  (list.data?.questions || []).forEach((q) => { (byDay[q.day] ||= []).push(q); });
  const today = ch.data?.day;

  return (
    <>
      <PageHeader title="Problems" subtitle="Every published question, grouped by challenge day. Older days stay open." />
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-mute" aria-hidden="true" /><input aria-label="Search by title" placeholder="Search by title" className="input pl-9" value={f.q} onChange={set('q')} /></div>
        <select aria-label="Filter by topic" className="input" value={f.topic} onChange={set('topic')}><option value="">All topics</option>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Filter by difficulty" className="input" value={f.difficulty} onChange={set('difficulty')}><option value="">All difficulties</option>{DIFFICULTIES.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Filter by day" className="input" value={f.day} onChange={set('day')}><option value="">All days</option>{Array.from({ length: 75 }, (_, i) => <option key={i + 1} value={i + 1}>Day {i + 1}</option>)}</select>
      </div>
      {list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : list.loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : !list.data.questions.length ? (
        <div className="card"><Empty title="No questions match" hint={Object.values(f).some(Boolean) ? 'Clear a filter to see more.' : 'No questions have been published yet.'} /></div>
      ) : (
        <div className="space-y-6">
          {Object.keys(byDay).map(Number).sort((a, b) => a - b).map((d) => (
            <section key={d} aria-label={`Day ${d}`}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-mute">Day {d}{d === today && <Badge tone="good">Today</Badge>}</h2>
              <ul className="space-y-2">
                {byDay[d].map((q) => (
                  <li key={q._id}>
                    <Link to={`/problems/${q.slug}`} className="card flex items-center justify-between gap-3 p-4 hover:border-accent/60">
                      <span className="flex min-w-0 items-center gap-3">
                        <CheckCircle2 className={`h-5 w-5 shrink-0 ${q.solved ? 'text-accent' : 'text-line'}`} aria-label={q.solved ? 'Solved' : 'Not solved'} />
                        <span className="min-w-0"><span className="block truncate font-medium">{q.title}</span><span className="text-xs text-mute">{q.topic}</span></span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">{isAdmin && !q.published && <Badge tone="warn">Draft</Badge>}<DifficultyBadge value={q.difficulty} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

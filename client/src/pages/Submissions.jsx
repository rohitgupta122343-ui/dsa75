import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { fmtDateTime, fmtMem, fmtTime, langLabel } from '../lib/format.js';
import { Empty, ErrorState, PageHeader, Skeleton, VerdictBadge } from '../components/ui.jsx';

const tabs = [['', 'All'], ['accepted', 'Accepted'], ['wrong_answer', 'Wrong Answer'], ['compilation_error', 'Compilation Error'], ['runtime_error', 'Runtime Error'], ['time_limit_exceeded', 'Time Limit']];

export default function Submissions() {
  const [verdict, setVerdict] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;
  const r = useAsync(() => api.get('/submissions', { params: { page, limit, ...(verdict ? { verdict } : {}) } }), [verdict, page]);
  const pages = r.data ? Math.max(1, Math.ceil(r.data.total / limit)) : 1;
  return (
    <>
      <PageHeader title="Submission history" subtitle="Newest first. Open one to review or reload its code." />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by verdict">
        {tabs.map(([v, label]) => <button key={v} role="tab" aria-selected={verdict === v} onClick={() => { setVerdict(v); setPage(1); }} className={verdict === v ? 'btn-primary' : 'btn-ghost'}>{label}</button>)}
      </div>
      {r.error ? <ErrorState error={r.error} onRetry={r.reload} /> : r.loading ? <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div> :
        !r.data.submissions.length ? <div className="card"><Empty title="No submissions here" hint={verdict ? 'Try the All tab.' : 'Open a problem and submit your first solution.'} action={<Link to="/problems" className="btn-primary">Browse problems</Link>} /></div> : (
          <>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-line text-left text-mute"><th className="p-3 font-medium">When</th><th className="p-3 font-medium">Problem</th><th className="p-3 font-medium">Language</th><th className="p-3 font-medium">Verdict</th><th className="p-3 font-medium">Tests</th><th className="p-3 font-medium">Time</th><th className="p-3 font-medium">Memory</th></tr></thead>
                <tbody>
                  {r.data.submissions.map((s) => (
                    <tr key={s._id} className="border-b border-line/60 last:border-0 hover:bg-raised/50">
                      <td className="p-3 text-mute"><Link to={`/submissions/${s._id}`} className="hover:text-accent">{fmtDateTime(s.createdAt)}</Link></td>
                      <td className="p-3 font-medium">{s.question ? <Link to={`/problems/${s.question.slug}`} className="hover:text-accent">{s.question.title}</Link> : 'Removed question'}</td>
                      <td className="p-3">{langLabel(s.language)}</td><td className="p-3"><VerdictBadge verdict={s.verdict} /></td>
                      <td className="p-3 tabular-nums">{s.passed}/{s.total}</td><td className="p-3 tabular-nums">{fmtTime(s.timeMs)}</td><td className="p-3 tabular-nums">{fmtMem(s.memoryKb)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-mute">
              <span>{r.data.total} submission{r.data.total === 1 ? '' : 's'}</span>
              <span className="flex items-center gap-2"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>Page {page} of {pages}<button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></span>
            </div>
          </>
        )}
    </>
  );
}

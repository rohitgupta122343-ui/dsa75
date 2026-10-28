import { Link, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { LANGS, fmtDateTime, fmtMem, fmtTime, langLabel } from '../lib/format.js';
import { ErrorState, PageHeader, Skeleton, VerdictBadge } from '../components/ui.jsx';

export default function SubmissionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const r = useAsync(() => api.get(`/submissions/${id}`), [id]);
  if (r.error) return <ErrorState error={r.error} onRetry={r.reload} />;
  if (r.loading) return <Skeleton className="h-96" />;
  const s = r.data.submission;
  const own = String(s.user) === String(user._id);
  return (
    <>
      <PageHeader title={s.question?.title || 'Removed question'} subtitle={`${fmtDateTime(s.createdAt)} · ${langLabel(s.language)}${own ? '' : ' · another participant'}`}
        actions={s.question && own && <button className="btn-primary" onClick={() => navigate(`/problems/${s.question.slug}`, { state: { load: { code: s.code, language: s.language } } })}>Open in editor</button>} />
      <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
        <VerdictBadge verdict={s.verdict} /><span className="tabular-nums">{s.passed}/{s.total} test cases</span><span className="text-mute">{fmtTime(s.timeMs)} · {fmtMem(s.memoryKb)}</span>
        {s.question && <Link to={`/problems/${s.question.slug}`} className="text-accent">View problem</Link>}
      </div>
      <div className="card h-[420px] overflow-hidden">
        <Editor height="100%" language={LANGS.find((l) => l.id === s.language)?.monaco} theme={user.theme === 'light' ? 'light' : 'vs-dark'} value={s.code}
          options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, fontFamily: '"JetBrains Mono", monospace', automaticLayout: true, scrollBeyondLastLine: false }} />
      </div>
      {(s.compileOutput || s.stderr) && <pre className="card mt-4 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs text-bad">{s.compileOutput || s.stderr}</pre>}
    </>
  );
}

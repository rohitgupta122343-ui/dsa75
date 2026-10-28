import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, SUBMIT_TIMEOUT } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { LANGS, VERDICTS, ago, fmtMem, fmtTime, langLabel } from '../lib/format.js';
import { Badge, DifficultyBadge, ErrorState, Skeleton, Spinner, VerdictBadge } from '../components/ui.jsx';

const draftKey = (qid, l) => `dsa75:draft:${qid}:${l}`;
const readDraft = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const writeDraft = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

const Block = ({ title, text, tone }) => (
  <div className="mt-3">
    <p className="mb-1 text-xs font-medium text-mute">{title}</p>
    <pre className={`max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-ink p-3 font-mono text-xs ${tone === 'bad' ? 'text-bad' : ''}`}>{text || '(empty)'}</pre>
  </div>
);

function Output({ out, running, submitting, samples }) {
  if (running || submitting) return <p className="flex items-center gap-2 text-sm text-mute"><Spinner />{submitting ? 'Evaluating against all test cases. This can take a while.' : 'Running your code...'}</p>;
  if (!out) return <p className="text-sm text-mute">Run executes the selected input only. Submit evaluates every test case, including hidden ones, and only an Accepted submission counts as solved.</p>;

  if (out.kind === 'error') {
    const e = out.error;
    return (
      <div role="alert" className="text-sm">
        <p className="font-semibold text-bad">{e.code === 'NOT_CONFIGURED' ? 'Code execution is not set up' : e.network ? 'Cannot reach the API' : e.code === 'UNAVAILABLE' || e.code === 'PROVIDER_ERROR' ? 'Execution service unavailable' : 'Request failed'}</p>
        <p className="mt-1 text-mute">{e.message}</p>
        {e.code === 'NOT_CONFIGURED' && <p className="mt-2 text-mute">The admin needs to set JUDGE0_API_URL (and JUDGE0_API_KEY if required) in the server environment, then restart the API.</p>}
      </div>
    );
  }

  if (out.kind === 'run') {
    const r = out.result;
    const expected = out.expected;
    const matches = expected != null && r.verdict === 'ok' && r.stdout.replace(/\s+$/gm, '').trim() === expected.replace(/\s+$/gm, '').trim();
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <VerdictBadge verdict={r.verdict} /><span className="text-mute">{fmtTime(r.timeMs)} · {fmtMem(r.memoryKb)}</span>
          {expected != null && r.verdict === 'ok' && <Badge tone={matches ? 'good' : 'bad'}>{matches ? 'Matches expected output' : 'Differs from expected output'}</Badge>}
        </div>
        {r.compileOutput && <Block title="Compilation output" text={r.compileOutput} tone="bad" />}
        <Block title="Standard output" text={r.stdout} />
        {r.stderr && <Block title="Standard error" text={r.stderr} tone="bad" />}
        {expected != null && !matches && r.verdict === 'ok' && <Block title="Expected output" text={expected} />}
        <p className="mt-3 text-xs text-mute">A run never changes your progress.</p>
      </div>
    );
  }

  const { submission: s, failedCase } = out;
  const hidden = Math.max(0, s.total - samples);
  const failedAt = s.verdict === 'accepted' ? -1 : s.passed;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <VerdictBadge verdict={s.verdict} />
        <span className="font-semibold tabular-nums">{s.passed}/{s.total} test cases</span>
        <span className="text-mute">{fmtTime(s.timeMs)} · {fmtMem(s.memoryKb)}</span>
      </div>
      {s.verdict === 'accepted' && <p className="mt-2 text-sm text-accent">{out.firstSolve ? 'Solved. This question now counts toward today.' : 'Accepted again. It was already counted, so your solved total is unchanged.'}</p>}
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Test case results">
        {Array.from({ length: s.total }, (_, i) => {
          const state = i < s.passed ? 'pass' : i === failedAt ? 'fail' : 'skip';
          const label = i < samples ? `Sample ${i + 1}` : `Hidden ${i - samples + 1}`;
          return <li key={i} className={`rounded-md px-2 py-1 text-xs font-medium ${state === 'pass' ? 'bg-accent/15 text-accent' : state === 'fail' ? 'bg-bad/15 text-bad' : 'bg-raised text-mute'}`}>{label}: {state === 'pass' ? 'passed' : state === 'fail' ? 'failed' : 'not run'}</li>;
        })}
      </ul>
      {s.compileOutput && <Block title="Compilation output" text={s.compileOutput} tone="bad" />}
      {s.stderr && <Block title="Standard error" text={s.stderr} tone="bad" />}
      {failedCase && (<><Block title="Failing input" text={failedCase.input} /><Block title="Expected output" text={failedCase.expected} /><Block title="Your output" text={failedCase.actual} tone="bad" /></>)}
      {s.verdict === 'wrong_answer' && !failedCase && hidden > 0 && <p className="mt-3 text-sm text-mute">A hidden test case failed. Hidden inputs and answers are never shown.</p>}
    </div>
  );
}

export default function Problem() {
  const { slug } = useParams();
  const loc = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const loadRef = useRef(loc.state?.load || null);
  const qr = useAsync(() => api.get(`/questions/${slug}`), [slug]);
  const q = qr.data?.question;

  const [lang, setLang] = useState(loadRef.current?.language || user.preferredLanguage || 'python');
  const [code, setCode] = useState('');
  const [testIdx, setTestIdx] = useState(0);
  const [custom, setCustom] = useState('');
  const [out, setOut] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('problem');

  const hist = useAsync(() => (q ? api.get('/submissions', { params: { question: q._id, limit: 30 } }) : null), [q?._id]);

  useEffect(() => {
    if (!q) return;
    if (loadRef.current && loadRef.current.language === lang) { setCode(loadRef.current.code); loadRef.current = null; return; }
    setCode(readDraft(draftKey(q._id, lang)) ?? q.starterCode?.[lang] ?? '');
  }, [q?._id, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (qr.error) return <ErrorState error={qr.error} onRetry={qr.reload} />;
  if (qr.loading || !q) return <div className="space-y-3"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;

  const samples = q.sampleTests || [];
  const isCustom = testIdx === 'custom';
  const input = isCustom ? custom : samples[testIdx]?.input ?? '';
  const expected = isCustom ? null : samples[testIdx]?.expectedOutput ?? null;
  const busy = running || submitting;

  const onCode = (v) => { setCode(v ?? ''); writeDraft(draftKey(q._id, lang), v ?? ''); };
  const reset = () => { writeDraft(draftKey(q._id, lang), null); setCode(q.starterCode?.[lang] ?? ''); toast.success('Code reset to the starter template'); };

  const run = async () => {
    setRunning(true); setOut(null);
    try { const d = await api.post('/run', { language: lang, code, input }); setOut({ kind: 'run', result: d.result, expected }); }
    catch (error) { setOut({ kind: 'error', error }); } finally { setRunning(false); }
  };
  const submit = async () => {
    setSubmitting(true); setOut(null);
    try {
      const d = await api.post('/submissions', { questionId: q._id, language: lang, code }, { timeout: SUBMIT_TIMEOUT });
      setOut({ kind: 'submit', ...d });
      if (d.submission.verdict === 'accepted') toast.success(d.firstSolve ? 'Accepted. Progress updated.' : 'Accepted. Already counted, total unchanged.');
      hist.reload();
    } catch (error) { setOut({ kind: 'error', error }); } finally { setSubmitting(false); }
  };
  const openSubmission = async (id) => {
    try { const d = await api.get(`/submissions/${id}`); setLang(d.submission.language); loadRef.current = { code: d.submission.code, language: d.submission.language }; if (d.submission.language === lang) { setCode(d.submission.code); loadRef.current = null; } toast.success('Loaded that submission into the editor'); setTab('problem'); }
    catch (e) { toast.error(e.message); }
  };

  const subs = hist.data?.submissions || [];
  const accepted = subs.filter((s) => s.verdict === 'accepted');
  const others = subs.filter((s) => s.verdict !== 'accepted');
  const SubRow = ({ s }) => (
    <li><button onClick={() => openSubmission(s._id)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-line p-3 text-left text-sm hover:border-accent/60">
      <span className="flex items-center gap-2"><VerdictBadge verdict={s.verdict} /><span className="text-mute">{langLabel(s.language)}</span></span>
      <span className="text-xs text-mute">{s.passed}/{s.total} · {ago(s.createdAt)}</span>
    </button></li>
  );

  return (
    <div className="grid gap-4 lg:h-[calc(100vh-4rem)] lg:grid-cols-2">
      <section className="card flex min-h-0 flex-col" aria-label="Problem">
        <div className="flex gap-1 border-b border-line p-2" role="tablist">
          {[['problem', 'Problem'], ['history', `Submissions${subs.length ? ` (${subs.length})` : ''}`]].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === id ? 'bg-raised text-fg' : 'text-mute hover:text-fg'}`}>{label}</button>
          ))}
          <Link to="/problems" className="ml-auto self-center px-2 text-sm text-mute hover:text-fg">All problems</Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'problem' ? (
            <>
              <h1 className="text-xl font-bold">{q.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2"><DifficultyBadge value={q.difficulty} /><Badge>{q.topic}</Badge><Badge>Day {q.day}</Badge>{!q.published && <Badge tone="warn">Draft</Badge>}</div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{q.statement}</p>
              {q.inputFormat && <Block title="Input format" text={q.inputFormat} />}
              {q.outputFormat && <Block title="Output format" text={q.outputFormat} />}
              {q.constraints && <Block title="Constraints" text={q.constraints} />}
              {(samples.length ? samples : q.sampleInput ? [{ input: q.sampleInput, expectedOutput: q.sampleOutput }] : []).map((t, i) => (
                <div key={i} className="mt-4"><p className="text-sm font-semibold">Example {i + 1}</p><Block title="Input" text={t.input} /><Block title="Output" text={t.expectedOutput} /></div>
              ))}
              {q.explanation && <Block title="Explanation" text={q.explanation} />}
            </>
          ) : hist.loading ? <Skeleton className="h-24" /> : !subs.length ? <p className="text-sm text-mute">No submissions for this problem yet.</p> : (
            <div className="space-y-5">
              <div><h2 className="mb-2 text-sm font-semibold text-accent">Accepted ({accepted.length})</h2>{accepted.length ? <ul className="space-y-2">{accepted.map((s) => <SubRow key={s._id} s={s} />)}</ul> : <p className="text-sm text-mute">None yet.</p>}</div>
              <div><h2 className="mb-2 text-sm font-semibold">Other attempts ({others.length})</h2>{others.length ? <ul className="space-y-2">{others.map((s) => <SubRow key={s._id} s={s} />)}</ul> : <p className="text-sm text-mute">None.</p>}</div>
            </div>
          )}
        </div>
      </section>

      <section className="flex min-h-0 flex-col gap-3" aria-label="Code editor">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="lang">Language</label>
          <select id="lang" className="input w-auto" value={lang} onChange={(e) => setLang(e.target.value)} disabled={busy}>{LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
          <button className="btn-ghost" onClick={reset} disabled={busy}><RotateCcw className="h-4 w-4" />Reset</button>
          <div className="ml-auto flex gap-2">
            <button className="btn-ghost" onClick={run} disabled={busy || !code.trim()}>{running ? <Spinner /> : <Play className="h-4 w-4" />}Run</button>
            <button className="btn-primary" onClick={submit} disabled={busy || !code.trim()}>{submitting ? <Spinner /> : <Send className="h-4 w-4" />}Submit</button>
          </div>
        </div>
        <div className="card min-h-[340px] flex-1 overflow-hidden">
          <Editor height="100%" language={LANGS.find((l) => l.id === lang).monaco} theme={user.theme === 'light' ? 'light' : 'vs-dark'} value={code} onChange={onCode}
            loading={<div className="p-4 text-sm text-mute">Loading editor...</div>}
            options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: '"JetBrains Mono", monospace', tabSize: 4, automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 12 } }} />
        </div>
        <div className="card max-h-[45%] overflow-y-auto p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <label htmlFor="case" className="text-sm font-medium">Input</label>
            <select id="case" className="input w-auto" value={testIdx} onChange={(e) => setTestIdx(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}>
              {samples.map((_, i) => <option key={i} value={i}>Sample {i + 1}</option>)}<option value="custom">Custom input</option>
            </select>
          </div>
          {isCustom ? <textarea aria-label="Custom input" className="input mb-3 h-20 font-mono text-xs" placeholder="Type stdin here" value={custom} onChange={(e) => setCustom(e.target.value)} />
            : <pre className="mb-3 max-h-24 overflow-auto rounded-lg border border-line bg-ink p-3 font-mono text-xs">{input || '(empty)'}</pre>}
          <Output out={out} running={running} submitting={submitting} samples={samples.length} />
        </div>
      </section>
    </div>
  );
}

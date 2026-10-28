import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { DIFFICULTIES, LANGS, TOPICS } from '../../lib/format.js';
import { ErrorState, Field, PageHeader, Skeleton, Spinner } from '../../components/ui.jsx';

const starters = {
  javascript: "const lines = require('fs').readFileSync(0, 'utf8').split('\\n');\n// TODO: solve and print the answer\n",
  python: 'import sys\ndata = sys.stdin.read().split()\n# TODO: solve and print the answer\n',
  c: '#include <stdio.h>\n\nint main() {\n    // TODO: read stdin, print the answer\n    return 0;\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // TODO: read stdin, print the answer\n    return 0;\n}\n',
};
const blank = {
  title: '', statement: '', topic: TOPICS[0], difficulty: 'Easy', day: 1, constraints: '', inputFormat: '', outputFormat: '',
  sampleInput: '', sampleOutput: '', explanation: '', starterCode: { ...starters },
  sampleTests: [{ input: '', expectedOutput: '' }], hiddenTests: [{ input: '', expectedOutput: '' }], published: false,
};

// Build exactly the fields the backend's strict schema accepts (no _id, slug, timestamps).
const toPayload = (f) => ({
  title: f.title.trim(), statement: f.statement, topic: f.topic, difficulty: f.difficulty, day: Number(f.day),
  constraints: f.constraints, inputFormat: f.inputFormat, outputFormat: f.outputFormat,
  sampleInput: f.sampleInput, sampleOutput: f.sampleOutput, explanation: f.explanation,
  starterCode: Object.fromEntries(LANGS.map((l) => [l.id, f.starterCode[l.id] ?? ''])),
  sampleTests: f.sampleTests.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
  hiddenTests: f.hiddenTests.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
  published: !!f.published,
});

function TestEditor({ title, note, tests, onChange, prefix }) {
  const upd = (i, k, v) => onChange(tests.map((t, j) => (j === i ? { ...t, [k]: v } : t)));
  return (
    <section className="card p-5" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div><h2 className="text-lg font-bold">{title}</h2><p className="text-xs text-mute">{note}</p></div>
        <button type="button" className="btn-ghost" onClick={() => onChange([...tests, { input: '', expectedOutput: '' }])}><Plus className="h-4 w-4" />Add case</button>
      </div>
      <div className="space-y-4">
        {tests.map((t, i) => (
          <div key={i} className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Field label={`${prefix} ${i + 1} input`} id={`${prefix}-in-${i}`}><textarea id={`${prefix}-in-${i}`} className="input h-24 font-mono text-xs" value={t.input} onChange={(e) => upd(i, 'input', e.target.value)} /></Field>
            <Field label={`${prefix} ${i + 1} expected output`} id={`${prefix}-out-${i}`}><textarea id={`${prefix}-out-${i}`} className="input h-24 font-mono text-xs" value={t.expectedOutput} onChange={(e) => upd(i, 'expectedOutput', e.target.value)} /></Field>
            <button type="button" className="btn-ghost self-start px-2.5 hover:text-bad sm:mt-6" onClick={() => onChange(tests.filter((_, j) => j !== i))} aria-label={`Remove ${prefix.toLowerCase()} case ${i + 1}`}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {!tests.length && <p className="text-sm text-mute">No cases yet.</p>}
      </div>
    </section>
  );
}

export default function QuestionForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(blank);
  const [lang, setLang] = useState('python');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useAsync(() => (editing ? api.get(`/questions/admin/${id}/full`) : null), [id]);

  useEffect(() => {
    const q = load.data?.question;
    if (!q) return;
    setF({ ...blank, ...Object.fromEntries(Object.keys(blank).map((k) => [k, q[k] ?? blank[k]])), starterCode: { ...starters, ...(q.starterCode || {}) } });
  }, [load.data]);

  if (editing && load.error) return <ErrorState error={load.error} onRetry={load.reload} />;
  if (editing && (load.loading || !load.data)) return <Skeleton className="h-96" />;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const totalTests = f.sampleTests.length + f.hiddenTests.length;
  const emptyExpected = [...f.sampleTests, ...f.hiddenTests].some((t) => !t.expectedOutput.trim());

  const save = async (e) => {
    e.preventDefault(); setError('');
    if (f.title.trim().length < 3) return setError('Title needs at least 3 characters.');
    if (f.statement.trim().length < 10) return setError('The problem statement needs at least 10 characters.');
    if (!(Number(f.day) >= 1 && Number(f.day) <= 75)) return setError('Day must be between 1 and 75.');
    if (emptyExpected) return setError('Every test case needs an expected output.');
    if (f.published && totalTests === 0) return setError('Add at least one test case before publishing.');
    setBusy(true);
    try {
      if (editing) await api.put(`/questions/${id}`, toPayload(f)); else await api.post('/questions', toPayload(f));
      toast.success(editing ? 'Question updated' : 'Question created');
      navigate('/admin/questions');
    } catch (err) {
      const first = Array.isArray(err.details) ? err.details[0] : null;
      setError(first ? `${first.path}: ${first.message}` : err.message);
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} noValidate className="max-w-4xl space-y-6">
      <PageHeader title={editing ? 'Edit question' : 'New question'} actions={<Link to="/admin/questions" className="btn-ghost">Cancel</Link>} />
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Title" id="title"><input id="title" className="input" value={f.title} onChange={set('title')} /></Field></div>
        <Field label="Topic" id="topic"><select id="topic" className="input" value={f.topic} onChange={set('topic')}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Difficulty" id="difficulty"><select id="difficulty" className="input" value={f.difficulty} onChange={set('difficulty')}>{DIFFICULTIES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Challenge day" id="day"><input id="day" type="number" min="1" max="75" className="input" value={f.day} onChange={set('day')} /></Field>
        </div>
        <div className="sm:col-span-2"><Field label="Problem statement" id="statement"><textarea id="statement" className="input h-40" value={f.statement} onChange={set('statement')} /></Field></div>
        <Field label="Input format" id="inputFormat"><textarea id="inputFormat" className="input h-20" value={f.inputFormat} onChange={set('inputFormat')} /></Field>
        <Field label="Output format" id="outputFormat"><textarea id="outputFormat" className="input h-20" value={f.outputFormat} onChange={set('outputFormat')} /></Field>
        <Field label="Constraints" id="constraints"><textarea id="constraints" className="input h-20" value={f.constraints} onChange={set('constraints')} /></Field>
        <Field label="Explanation" id="explanation" hint="Shown after the examples"><textarea id="explanation" className="input h-20" value={f.explanation} onChange={set('explanation')} /></Field>
        <Field label="Example input" id="sampleInput" hint="Fallback shown if there are no public test cases"><textarea id="sampleInput" className="input h-20 font-mono text-xs" value={f.sampleInput} onChange={set('sampleInput')} /></Field>
        <Field label="Example output" id="sampleOutput"><textarea id="sampleOutput" className="input h-20 font-mono text-xs" value={f.sampleOutput} onChange={set('sampleOutput')} /></Field>
      </section>

      <section className="card p-5" aria-label="Starter code">
        <h2 className="mb-3 text-lg font-bold">Starter code</h2>
        <div className="mb-3 flex gap-1" role="tablist">{LANGS.map((l) => <button type="button" key={l.id} role="tab" aria-selected={lang === l.id} onClick={() => setLang(l.id)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${lang === l.id ? 'bg-raised text-fg' : 'text-mute hover:text-fg'}`}>{l.label}</button>)}</div>
        <label htmlFor="starter" className="sr-only">Starter code for {lang}</label>
        <textarea id="starter" spellCheck="false" className="input h-56 font-mono text-xs" value={f.starterCode[lang] ?? ''} onChange={(e) => setF({ ...f, starterCode: { ...f.starterCode, [lang]: e.target.value } })} />
      </section>

      <TestEditor title="Public sample test cases" note="Visible to participants and used by Run." prefix="Sample" tests={f.sampleTests} onChange={(v) => setF({ ...f, sampleTests: v })} />
      <TestEditor title="Hidden test cases" note="Only evaluated on Submit. Never sent to participants." prefix="Hidden" tests={f.hiddenTests} onChange={(v) => setF({ ...f, hiddenTests: v })} />

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />Published (visible to participants)</label>
        <div className="flex items-center gap-3">{error && <p role="alert" className="text-sm text-bad">{error}</p>}<button className="btn-primary" disabled={busy}>{busy && <Spinner />}{editing ? 'Save changes' : 'Create question'}</button></div>
      </section>
    </form>
  );
}

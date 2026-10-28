import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { DIFFICULTIES, TOPICS } from '../../lib/format.js';
import { Badge, ConfirmDialog, DifficultyBadge, Empty, ErrorState, PageHeader, Skeleton } from '../../components/ui.jsx';

export default function AdminQuestions() {
  const toast = useToast();
  const [f, setF] = useState({ q: '', topic: '', difficulty: '', day: '' });
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const r = useAsync(() => api.get('/questions', { params: Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }), [f.q, f.topic, f.difficulty, f.day]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const togglePublish = async (q) => {
    try { await api.put(`/questions/${q._id}`, { published: !q.published }); toast.success(q.published ? 'Unpublished' : 'Published'); r.reload(); }
    catch (e) { toast.error(e.message); }
  };
  const del = async () => {
    setBusy(true);
    try { await api.delete(`/questions/${target._id}`); toast.success('Question deleted'); setTarget(null); r.reload(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Manage questions" actions={<Link to="/admin/questions/new" className="btn-primary"><Plus className="h-4 w-4" />New question</Link>} />
      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input aria-label="Search by title" placeholder="Search by title" className="input" value={f.q} onChange={set('q')} />
        <select aria-label="Filter by topic" className="input" value={f.topic} onChange={set('topic')}><option value="">All topics</option>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Filter by difficulty" className="input" value={f.difficulty} onChange={set('difficulty')}><option value="">All difficulties</option>{DIFFICULTIES.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="Filter by day" className="input" value={f.day} onChange={set('day')}><option value="">All days</option>{Array.from({ length: 75 }, (_, i) => <option key={i + 1} value={i + 1}>Day {i + 1}</option>)}</select>
      </div>
      {r.error ? <ErrorState error={r.error} onRetry={r.reload} /> : r.loading ? <Skeleton className="h-48" /> : !r.data.questions.length ? (
        <div className="card"><Empty title="No questions found" hint="Create the first question for Day 1." action={<Link to="/admin/questions/new" className="btn-primary">New question</Link>} /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-mute"><th className="p-3 font-medium">Day</th><th className="p-3 font-medium">Title</th><th className="p-3 font-medium">Topic</th><th className="p-3 font-medium">Difficulty</th><th className="p-3 font-medium">Status</th><th className="p-3 text-right font-medium">Actions</th></tr></thead>
            <tbody>
              {r.data.questions.map((q) => (
                <tr key={q._id} className="border-b border-line/60 last:border-0">
                  <td className="p-3 tabular-nums">{q.day}</td><td className="p-3 font-medium"><Link to={`/problems/${q.slug}`} className="hover:text-accent">{q.title}</Link></td>
                  <td className="p-3 text-mute">{q.topic}</td><td className="p-3"><DifficultyBadge value={q.difficulty} /></td>
                  <td className="p-3"><button onClick={() => togglePublish(q)} className="rounded-md focus-visible:outline-accent" aria-label={q.published ? `Unpublish ${q.title}` : `Publish ${q.title}`}><Badge tone={q.published ? 'good' : 'warn'}>{q.published ? 'Published' : 'Draft'}</Badge></button></td>
                  <td className="p-3"><div className="flex justify-end gap-2">
                    <Link to={`/admin/questions/${q._id}/edit`} className="btn-ghost px-2.5" aria-label={`Edit ${q.title}`}><Pencil className="h-4 w-4" /></Link>
                    <button className="btn-ghost px-2.5 hover:text-bad" onClick={() => setTarget(q)} aria-label={`Delete ${q.title}`}><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={!!target} title="Delete this question?" message={`"${target?.title}" will be removed for both participants. Existing submissions are kept but will show as a removed question.`} confirmLabel="Delete question" busy={busy} onConfirm={del} onCancel={() => setTarget(null)} />
    </>
  );
}

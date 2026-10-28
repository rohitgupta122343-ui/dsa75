import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { ago, fmtDate, fmtMem, fmtTime } from '../lib/format.js';
import Calendar, { CalendarSkeleton } from '../components/Calendar.jsx';
import CompareTable from '../components/CompareTable.jsx';
import { DifficultyBadge, Empty, ErrorState, PageHeader, ProgressBar, Skeleton, Stat, VerdictBadge } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const ch = useAsync(() => api.get('/challenge'), []);
  const parts = useAsync(() => api.get('/participants'), []);
  const mine = useAsync(() => api.get('/progress/me/stats'), []);
  const cal = useAsync(() => api.get('/progress/me/calendar'), []);
  const recent = useAsync(() => api.get('/submissions', { params: { limit: 5 } }), []);
  const partner = parts.data?.users.find((u) => u._id !== user._id);
  const pStats = useAsync(() => (partner ? api.get(`/progress/${partner._id}/stats`) : null), [partner?._id]);
  const pCal = useAsync(() => (partner ? api.get(`/progress/${partner._id}/calendar`) : null), [partner?._id]);
  const day = ch.data?.day;
  const today = useAsync(() => (ch.data?.started && !ch.data?.finished ? api.get('/questions', { params: { day } }) : null), [day, ch.data?.started]);

  if (ch.error) return <ErrorState error={ch.error} onRetry={ch.reload} />;
  const s = mine.data?.stats;
  const retry = () => { ch.reload(); mine.reload(); cal.reload(); };

  return (
    <>
      <PageHeader
        title={`Hi ${user.username}`}
        subtitle={ch.data ? (ch.data.started ? (ch.data.finished ? 'The 75 days are complete.' : `Day ${ch.data.day} of ${ch.data.challenge.totalDays}`) : `The challenge starts on ${fmtDate(`${ch.data.challenge.startDate}T00:00:00Z`)}.`) : ' '}
        actions={<Link to={today.data?.questions.find((q) => !q.solved) ? `/problems/${today.data.questions.find((q) => !q.solved).slug}` : '/problems'} className="btn-primary">Continue practicing <ArrowRight className="h-4 w-4" /></Link>}
      />

      {s?.dailyGoalMet && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4" role="status">
          <PartyPopper className="h-5 w-5 text-accent" aria-hidden="true" />
          <p className="text-sm font-medium">Daily goal met: {s.todaySolved} accepted today. That keeps your streak alive.</p>
        </div>
      )}

      <section className="card p-5" aria-label="Your calendar">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Your 75 days</h2>
          {s && <p className="text-sm text-mute">{s.completedDays} days completed · {s.missedDays} missed · {s.completionPct}% of the challenge</p>}
        </div>
        {cal.error ? <ErrorState error={cal.error} onRetry={retry} /> : cal.loading || !cal.data ? <CalendarSkeleton /> : <Calendar cal={cal.data} userId={user._id} />}
        {s && <div className="mt-4"><ProgressBar value={s.completedDays} max={75} label="Challenge completion" /></div>}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {mine.loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />) : s ? (
          <>
            <Stat label="Accepted questions" value={s.totalSolved} sub={`of ${s.totalQuestions} published`} />
            <Stat label="Current streak" value={s.currentStreak} sub="days in a row" />
            <Stat label="Longest streak" value={s.longestStreak} sub="days" />
            <Stat label="Active days" value={s.activeDays} sub={`${s.todaySolved} accepted today`} />
          </>
        ) : <div className="col-span-full"><ErrorState error={mine.error} onRetry={mine.reload} /></div>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-1" aria-label="Today's challenge">
          <h2 className="mb-3 text-lg font-bold">Today's challenge</h2>
          {today.loading || ch.loading ? <Skeleton className="h-16" /> : !ch.data?.started ? <Empty title="Not started yet" hint="Questions for Day 1 unlock when the challenge begins." /> :
            ch.data.finished ? <Empty title="Challenge complete" hint="Revisit any problem from the Problems page." /> :
            !today.data?.questions.length ? <Empty title={`Nothing published for Day ${day}`} hint="Ask the admin to publish today's question." /> : (
              <ul className="space-y-2">
                {today.data.questions.map((q) => (
                  <li key={q._id}>
                    <Link to={`/problems/${q.slug}`} className="flex items-center justify-between gap-2 rounded-lg border border-line p-3 hover:border-accent/60">
                      <span className="min-w-0"><span className="block truncate font-medium">{q.title}</span><span className="text-xs text-mute">{q.topic}</span></span>
                      <span className="flex shrink-0 items-center gap-2"><DifficultyBadge value={q.difficulty} />{q.solved && <span className="text-xs font-semibold text-accent">Solved</span>}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </section>

        <section className="card p-5 lg:col-span-1" aria-label="Difficulty breakdown">
          <h2 className="mb-3 text-lg font-bold">By difficulty</h2>
          {s ? ['Easy', 'Medium', 'Hard'].map((d) => (
            <div key={d} className="mb-3 last:mb-0"><div className="mb-1 flex justify-between text-sm"><DifficultyBadge value={d} /><span className="tabular-nums">{s.byDifficulty[d]} solved</span></div><ProgressBar value={s.byDifficulty[d]} max={Math.max(s.totalQuestions, 1)} label={`${d} solved`} /></div>
          )) : <Skeleton className="h-24" />}
        </section>

        <section className="card p-5 lg:col-span-1" aria-label="Recent submissions">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Recent submissions</h2><Link to="/submissions" className="text-sm text-accent">View all</Link></div>
          {recent.loading ? <Skeleton className="h-24" /> : !recent.data?.submissions.length ? <Empty title="No submissions yet" hint="Submit a solution and it appears here." /> : (
            <ul className="space-y-2">
              {recent.data.submissions.map((x) => (
                <li key={x._id}><Link to={`/submissions/${x._id}`} className="flex items-center justify-between gap-2 text-sm hover:text-accent"><span className="truncate">{x.question?.title || 'Removed question'}</span><span className="flex shrink-0 items-center gap-2"><VerdictBadge verdict={x.verdict} /><span className="text-xs text-mute">{ago(x.createdAt)}</span></span></Link></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-label="Topic progress">
          <h2 className="mb-3 text-lg font-bold">Topic progress</h2>
          {!s ? <Skeleton className="h-48" /> : !s.topics.length ? <Empty title="No topics yet" hint="Topics appear once questions are published." /> : (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.topics} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid horizontal={false} stroke="rgb(var(--line))" />
                <XAxis type="number" allowDecimals={false} stroke="rgb(var(--mute))" fontSize={12} />
                <YAxis type="category" dataKey="topic" width={110} stroke="rgb(var(--mute))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'rgb(var(--raised))', border: '1px solid rgb(var(--line))', borderRadius: 8 }} cursor={{ fill: 'rgb(var(--raised))' }} />
                <Bar dataKey="total" name="Published" fill="rgb(var(--line))" radius={4} />
                <Bar dataKey="solved" name="Solved" fill="rgb(var(--accent))" radius={4} />
              </BarChart>
            </ResponsiveContainer></div>
          )}
        </section>

        <section className="card p-5" aria-label="Partner comparison">
          <h2 className="mb-3 text-lg font-bold">You and {partner?.username || 'your partner'}</h2>
          {!partner && !parts.loading ? <Empty title="Waiting for your partner" hint="Comparison appears once the second participant has registered." /> :
            s && pStats.data ? <CompareTable people={[{ name: user.username, stats: s, isYou: true }, { name: partner.username, stats: pStats.data.stats }]} /> : <Skeleton className="h-48" />}
        </section>
      </div>

      {partner && (
        <section className="card mt-6 p-5" aria-label="Partner calendar">
          <h2 className="mb-4 text-lg font-bold">{partner.username}'s 75 days</h2>
          {pCal.data ? <Calendar cal={pCal.data} userId={partner._id} /> : pCal.error ? <ErrorState error={pCal.error} onRetry={pCal.reload} /> : <CalendarSkeleton />}
        </section>
      )}
    </>
  );
}

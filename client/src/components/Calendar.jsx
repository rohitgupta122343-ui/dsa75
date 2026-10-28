import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { fmtDay } from '../lib/format.js';
import { DifficultyBadge, Skeleton } from './ui.jsx';

const levelClass = ['bg-raised', 'bg-accent/30', 'bg-accent/65', 'bg-accent'];
const cellClass = (d) =>
  `${levelClass[d.level]} ${d.status === 'missed' ? 'ring-1 ring-inset ring-bad/50' : ''} ${d.status === 'upcoming' ? 'opacity-45' : ''} ${d.status === 'today' ? 'ring-2 ring-fg' : ''}`;

function DayDetail({ userId, day }) {
  const { data, loading, error } = useAsync(() => (day.solved ? api.get(`/progress/${userId}/day/${day.date}`) : Promise.resolve({ accepted: [] })), [userId, day.date, day.solved]);
  const statusText = { completed: 'Completed', missed: 'Missed', today: 'Today, not solved yet', upcoming: 'Upcoming' }[day.status];
  return (
    <div className="mt-4 rounded-lg border border-line bg-ink p-4" aria-live="polite">
      <p className="font-semibold">Day {day.day} · {fmtDay(day.date)}</p>
      <p className="mt-0.5 text-sm text-mute">{statusText}. {day.submissions} submission{day.submissions === 1 ? '' : 's'}, {day.solved} accepted.</p>
      {day.solved > 0 && (
        <ul className="mt-3 space-y-1.5">
          {loading && <Skeleton className="h-5 w-48" />}
          {error && <li className="text-sm text-bad">{error.message}</li>}
          {data?.accepted.map((q) => (
            <li key={q._id} className="flex items-center gap-2 text-sm">
              <Link to={`/problems/${q.slug}`} className="font-medium hover:text-accent">{q.title}</Link>
              <DifficultyBadge value={q.difficulty} />
              <span className="text-mute">{q.topic}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** GitHub-style grid: 7 rows, one column per week of the challenge. Data comes straight from /progress/:id/calendar. */
export default function Calendar({ cal, userId }) {
  const [selected, setSelected] = useState(null);
  const sel = cal.days.find((d) => d.day === selected) || cal.days.find((d) => d.status === 'today') || null;
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1.5" role="grid" aria-label="75-day challenge calendar">
          {cal.days.map((d) => (
            <button
              key={d.day} role="gridcell" type="button" onClick={() => setSelected(d.day)}
              title={`Day ${d.day}, ${d.date}: ${d.solved} accepted`}
              aria-label={`Day ${d.day}, ${fmtDay(d.date)}, ${d.solved} accepted, ${d.submissions} submissions, ${d.status}`}
              aria-pressed={sel?.day === d.day}
              className={`h-5 w-5 rounded-[5px] transition-transform hover:scale-125 sm:h-6 sm:w-6 ${cellClass(d)}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
        <span className="flex items-center gap-1.5">None <i className="h-3 w-3 rounded bg-raised" /><i className="h-3 w-3 rounded bg-accent/30" /><i className="h-3 w-3 rounded bg-accent/65" /><i className="h-3 w-3 rounded bg-accent" /> More accepted</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-raised ring-1 ring-inset ring-bad/50" /> Missed</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-raised ring-2 ring-fg" /> Today</span>
      </div>
      {sel ? <DayDetail userId={userId} day={sel} /> : <p className="mt-4 text-sm text-mute">Select a square to see that day.</p>}
    </div>
  );
}

export function CalendarSkeleton() {
  return <div className="grid w-max grid-flow-col grid-rows-7 gap-1.5">{Array.from({ length: 77 }, (_, i) => <div key={i} className="skeleton h-6 w-6" />)}</div>;
}

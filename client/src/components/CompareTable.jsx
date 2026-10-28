import { Trophy } from 'lucide-react';

const rows = [
  ['Accepted questions', (s) => s.totalSolved],
  ['Days completed', (s) => s.completedDays],
  ['Current streak', (s) => s.currentStreak],
  ['Longest streak', (s) => s.longestStreak],
  ['Easy solved', (s) => s.byDifficulty.Easy],
  ['Medium solved', (s) => s.byDifficulty.Medium],
  ['Hard solved', (s) => s.byDifficulty.Hard],
  ['Challenge completion', (s) => `${s.completionPct}%`],
];

/** people: [{ name, stats, isYou, rank? }] */
export default function CompareTable({ people }) {
  const num = (v) => (typeof v === 'string' ? parseInt(v, 10) : v);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-mute">
            <th className="py-2 pr-4 font-medium"><span className="sr-only">Metric</span></th>
            {people.map((p) => (
              <th key={p.name} className="px-3 py-2 font-semibold text-fg">
                <span className="inline-flex items-center gap-1.5">{p.rank === 1 && <Trophy className="h-4 w-4 text-warn" aria-label="Leading" />}{p.name}{p.isYou && <span className="text-xs font-normal text-mute">(you)</span>}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, get]) => {
            const vals = people.map((p) => num(get(p.stats)));
            const best = Math.max(...vals);
            return (
              <tr key={label} className="border-b border-line/60 last:border-0">
                <td className="py-2 pr-4 text-mute">{label}</td>
                {people.map((p, i) => (
                  <td key={p.name} className={`px-3 py-2 tabular-nums ${vals[i] === best && best > 0 && people.length > 1 && vals.filter((v) => v === best).length === 1 ? 'font-bold text-accent' : ''}`}>{get(p.stats)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

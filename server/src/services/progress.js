import { addDays, diffDays } from '../utils/dates.js';

/** Streaks over a set of YYYY-MM-DD keys that had >=1 accepted solve. */
export function computeStreaks(keys, todayKey) {
  const days = [...new Set(keys)].sort();
  if (!days.length) return { current: 0, longest: 0 };
  let longest = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    run = diffDays(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  // A streak is still alive if the latest solve was today or yesterday.
  const last = days[days.length - 1];
  const gap = diffDays(last, todayKey);
  let current = 0;
  if (gap >= 0 && gap <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0 && diffDays(days[i - 1], days[i]) === 1; i--) current++;
  }
  return { current, longest };
}

export const levelFor = (n) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);

/**
 * Builds the 75-day grid. A day's state depends only on activity that happened ON that day,
 * so solving later never retroactively completes a missed day.
 */
export function buildCalendar({ startKey, totalDays, todayKey, solvedByDay, subsByDay }) {
  const days = [];
  let completed = 0, missed = 0, pending = 0;
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startKey, i);
    const solved = solvedByDay.get(date) || 0;
    const submissions = subsByDay.get(date) || 0;
    let status;
    if (solved > 0) { status = 'completed'; completed++; }
    else if (date < todayKey) { status = 'missed'; missed++; }
    else { status = date === todayKey ? 'today' : 'upcoming'; pending++; }
    days.push({ day: i + 1, date, solved, submissions, level: levelFor(solved), status });
  }
  return { days, summary: { completed, missed, pending, totalDays } };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStreaks, buildCalendar, levelFor } from '../src/services/progress.js';
import { outputsMatch } from '../src/services/compare.js';
import { dayKeyFor, addDays } from '../src/utils/dates.js';

test('dayKeyFor respects timezone boundaries', () => {
  const t = new Date('2026-11-01T20:00:00Z'); // 01:30 next day in IST
  assert.equal(dayKeyFor(t, 'UTC'), '2026-11-01');
  assert.equal(dayKeyFor(t, 'Asia/Kolkata'), '2026-11-02');
});

test('addDays crosses month boundaries', () => assert.equal(addDays('2026-11-30', 1), '2026-12-01'));

test('streaks: consecutive days, gaps, and live-until-end-of-day', () => {
  const keys = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06'];
  assert.deepEqual(computeStreaks(keys, '2026-11-06'), { current: 2, longest: 3 });
  assert.deepEqual(computeStreaks(keys, '2026-11-07'), { current: 2, longest: 3 });
  assert.deepEqual(computeStreaks(keys, '2026-11-08'), { current: 0, longest: 3 });
  assert.deepEqual(computeStreaks([], '2026-11-08'), { current: 0, longest: 0 });
  assert.deepEqual(computeStreaks(['2026-11-01', '2026-11-01'], '2026-11-01'), { current: 1, longest: 1 });
});

test('levels', () => assert.deepEqual([0, 1, 2, 3, 4, 9].map(levelFor), [0, 1, 2, 2, 3, 3]));

test('calendar: missed days stay missed; later solves do not backfill', () => {
  const cal = buildCalendar({ startKey: '2026-11-01', totalDays: 75, todayKey: '2026-11-04', subsByDay: new Map(),
    solvedByDay: new Map([['2026-11-01', 1], ['2026-11-04', 2]]) });
  assert.equal(cal.days.length, 75);
  assert.deepEqual(cal.days.slice(0, 4).map((d) => d.status), ['completed', 'missed', 'missed', 'completed']);
  assert.equal(cal.days[4].status, 'upcoming');
  assert.deepEqual(cal.summary, { completed: 2, missed: 2, pending: 71, totalDays: 75 });
});

test('output comparison ignores trailing whitespace only', () => {
  assert.ok(outputsMatch('0 1  \r\n\n', '0 1'));
  assert.ok(!outputsMatch('1 0', '0 1'));
  assert.ok(!outputsMatch('a\nb', 'a b'));
});

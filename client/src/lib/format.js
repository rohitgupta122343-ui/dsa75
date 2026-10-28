export const LANGS = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { id: 'python', label: 'Python', monaco: 'python' },
  { id: 'c', label: 'C', monaco: 'c' },
  { id: 'cpp', label: 'C++', monaco: 'cpp' },
];
export const langLabel = (id) => LANGS.find((l) => l.id === id)?.label || id;

// Mirrors the backend enum in server/src/models/Question.js
export const TOPICS = ['Arrays','Strings','Hashing','Searching','Sorting','Two Pointers','Sliding Window','Recursion','Backtracking','Linked Lists','Stacks','Queues','Binary Search','Trees','Binary Search Trees','Heaps','Graphs','Greedy Algorithms','Dynamic Programming','Bit Manipulation'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
export const diffTone = { Easy: 'good', Medium: 'warn', Hard: 'bad' };

export const VERDICTS = {
  accepted: { label: 'Accepted', tone: 'good' },
  wrong_answer: { label: 'Wrong Answer', tone: 'bad' },
  compilation_error: { label: 'Compilation Error', tone: 'warn' },
  runtime_error: { label: 'Runtime Error', tone: 'bad' },
  time_limit_exceeded: { label: 'Time Limit Exceeded', tone: 'warn' },
  memory_limit_exceeded: { label: 'Memory Limit Exceeded', tone: 'warn' },
  internal_error: { label: 'Internal Error', tone: 'warn' },
  ok: { label: 'Ran successfully', tone: 'good' },
};

export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDay = (key) => new Date(`${key}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
export const fmtDateTime = (d) => new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const fmtMem = (kb) => (kb == null ? '–' : kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
export const fmtTime = (ms) => (ms == null ? '–' : `${ms} ms`);

export function ago(d) {
  const s = Math.max(1, Math.round((Date.now() - new Date(d)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

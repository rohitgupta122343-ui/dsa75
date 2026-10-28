/** Ignores trailing whitespace per line and trailing blank lines. */
const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
export const outputsMatch = (actual, expected) => norm(actual) === norm(expected);

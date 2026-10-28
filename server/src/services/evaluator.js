import { execute } from './executor.js';
import { outputsMatch } from './compare.js';

/** Runs sample + hidden tests sequentially; stops at first failure. Hidden details are never returned. */
export async function evaluate({ question, language, code }) {
  const tests = [
    ...question.sampleTests.map((t) => ({ ...t, isPublic: true })),
    ...question.hiddenTests.map((t) => ({ ...t, isPublic: false })),
  ];
  const total = tests.length;
  let passed = 0, timeMs = 0, memoryKb = 0;
  for (const t of tests) {
    const r = await execute({ language, code, stdin: t.input });
    timeMs = Math.max(timeMs, r.timeMs || 0);
    memoryKb = Math.max(memoryKb, r.memoryKb || 0);
    const base = { passed, total, timeMs, memoryKb };
    if (r.verdict !== 'ok') {
      return { ...base, verdict: r.verdict, stderr: r.stderr.slice(0, 4000), compileOutput: r.compileOutput.slice(0, 4000) };
    }
    if (!outputsMatch(r.stdout, t.expectedOutput)) {
      return {
        ...base, verdict: 'wrong_answer', stderr: '', compileOutput: '',
        failedCase: t.isPublic ? { input: t.input, expected: t.expectedOutput, actual: r.stdout.slice(0, 4000) } : null,
      };
    }
    passed++;
  }
  if (total === 0) return { verdict: 'internal_error', passed: 0, total: 0, timeMs, memoryKb, stderr: 'Question has no test cases.', compileOutput: '' };
  return { verdict: 'accepted', passed, total, timeMs, memoryKb, stderr: '', compileOutput: '' };
}

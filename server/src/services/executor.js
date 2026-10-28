import { config } from '../config.js';

export const LANGUAGES = { javascript: 63, python: 71, c: 50, cpp: 54 }; // Judge0 CE ids
export const LIMITS = { cpuSeconds: 2, memoryKb: 256000, outputKb: 64 };

export class ExecError extends Error {
  constructor(code, message, status = 503) { super(message); this.code = code; this.status = status; }
}

const b64 = (s) => Buffer.from(s ?? '', 'utf8').toString('base64');
const unb64 = (s) => (s ? Buffer.from(s, 'base64').toString('utf8') : '');
const nearLimit = (kb) => kb && kb >= LIMITS.memoryKb * 0.98;

function verdictFromStatus(id, memoryKb) {
  if (id === 3) return nearLimit(memoryKb) ? 'memory_limit_exceeded' : 'ok';
  if (id === 5) return 'time_limit_exceeded';
  if (id === 6) return 'compilation_error';
  if ([7, 8, 9, 10, 11, 12, 14].includes(id)) return nearLimit(memoryKb) ? 'memory_limit_exceeded' : 'runtime_error';
  return 'internal_error';
}

/** Provider contract: execute({language, code, stdin}) -> { verdict, stdout, stderr, compileOutput, timeMs, memoryKb } */
const judge0 = {
  async execute({ language, code, stdin }) {
    const { url, apiKey, authHeader, apiHost } = config.judge0;
    if (!url) throw new ExecError('NOT_CONFIGURED', 'Code execution is not configured. Set JUDGE0_API_URL (and JUDGE0_API_KEY if required).');
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers[authHeader] = apiKey;
    if (apiHost) headers['X-RapidAPI-Host'] = apiHost;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    let res;
    try {
      res = await fetch(`${url}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST', headers, signal: ctrl.signal,
        body: JSON.stringify({
          language_id: LANGUAGES[language], source_code: b64(code), stdin: b64(stdin),
          cpu_time_limit: LIMITS.cpuSeconds, memory_limit: LIMITS.memoryKb, max_file_size: LIMITS.outputKb,
        }),
      });
    } catch (e) {
      throw new ExecError('UNAVAILABLE', e.name === 'AbortError' ? 'Execution service timed out.' : 'Execution service is unreachable.');
    } finally { clearTimeout(timer); }
    if (res.status === 429) throw new ExecError('RATE_LIMITED', 'Execution service rate limit reached. Try again shortly.', 429);
    if (!res.ok) throw new ExecError('PROVIDER_ERROR', `Execution service error (${res.status}).`);
    const r = await res.json();
    const memoryKb = r.memory ?? null;
    return {
      verdict: verdictFromStatus(r.status?.id, memoryKb),
      stdout: unb64(r.stdout), stderr: unb64(r.stderr), compileOutput: unb64(r.compile_output),
      timeMs: r.time != null ? Math.round(parseFloat(r.time) * 1000) : null, memoryKb,
    };
  },
};

const providers = { judge0 };
export const execute = (args) => providers.judge0.execute(args); // swap provider here

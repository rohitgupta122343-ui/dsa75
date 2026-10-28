import { useEffect, useRef } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { VERDICTS, diffTone } from '../lib/format.js';

const tones = { good: 'bg-accent/15 text-accent', warn: 'bg-warn/15 text-warn', bad: 'bg-bad/15 text-bad', mute: 'bg-raised text-mute' };

export const Badge = ({ tone = 'mute', children, className = '' }) => (
  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}>{children}</span>
);
export const DifficultyBadge = ({ value }) => <Badge tone={diffTone[value]}>{value}</Badge>;
export const VerdictBadge = ({ verdict }) => {
  const v = VERDICTS[verdict] || { label: verdict, tone: 'mute' };
  return <Badge tone={v.tone}>{v.label}</Badge>;
};

export const Skeleton = ({ className = 'h-4 w-full' }) => <div className={`skeleton ${className}`} aria-hidden="true" />;
export const Spinner = ({ className = 'h-4 w-4' }) => <Loader2 className={`animate-spin ${className}`} aria-label="Loading" />;

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const Empty = ({ title, hint, action }) => (
  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
    <Inbox className="h-8 w-8 text-mute" aria-hidden="true" />
    <p className="font-semibold">{title}</p>
    {hint && <p className="max-w-sm text-sm text-mute">{hint}</p>}
    {action}
  </div>
);

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-8 text-center" role="alert">
      <AlertTriangle className="h-8 w-8 text-bad" aria-hidden="true" />
      <p className="font-semibold">{error?.network ? 'Cannot reach the API' : 'Could not load this'}</p>
      <p className="max-w-md text-sm text-mute">{error?.message}</p>
      {onRetry && <button className="btn-ghost mt-2" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Field({ label, id, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', busy, onConfirm, onCancel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    ref.current?.focus();
    const esc = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg" className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 id="dlg-title" className="text-lg font-bold">{title}</h2>
        <p id="dlg-msg" className="mt-2 text-sm text-mute">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={ref} className="btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={busy}>{busy && <Spinner />}{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export const Stat = ({ label, value, sub }) => (
  <div className="card p-4">
    <p className="text-sm text-mute">{label}</p>
    <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-mute">{sub}</p>}
  </div>
);

export function ProgressBar({ value, max = 100, label }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

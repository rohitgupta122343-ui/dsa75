import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, Spinner } from '../components/ui.jsx';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-full place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 grid-cols-2 gap-1 rounded-xl bg-raised p-2" aria-hidden="true"><i className="rounded-sm bg-accent" /><i className="rounded-sm bg-accent/40" /><i className="rounded-sm bg-accent/40" /><i className="rounded-sm bg-accent" /></span>
          <div><h1 className="text-xl font-bold">{title}</h1><p className="text-sm text-mute">{subtitle}</p></div>
        </div>
        <div className="card p-5">{children}</div>
        <p className="mt-4 text-center text-sm text-mute">{footer}</p>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await login(form.email, form.password); navigate(loc.state?.from || '/', { replace: true }); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Log in" subtitle="Pick up where your streak left off." footer={<>New here? <Link to="/register" className="font-semibold text-accent">Create the participant account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" id="email"><input id="email" type="email" autoComplete="email" required className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" id="password"><input id="password" type="password" autoComplete="current-password" required className="input" value={form.password} onChange={set('password')} /></Field>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !form.email || !form.password}>{busy && <Spinner />}Log in</button>
      </form>
    </AuthShell>
  );
}

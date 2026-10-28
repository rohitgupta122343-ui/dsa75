import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, Spinner } from '../components/ui.jsx';
import { AuthShell } from './Login.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.username.trim().length >= 3 && form.email && form.password.length >= 8;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await register(form.username.trim(), form.email, form.password); navigate('/', { replace: true }); }
    catch (err) {
      const first = Array.isArray(err.details) ? err.details[0] : null;
      setError(first ? `${first.path}: ${first.message}` : err.message);
    } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Create account" subtitle="Registration is open for the one partner account." footer={<>Already registered? <Link to="/login" className="font-semibold text-accent">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Username" id="username" hint="3 to 30 characters"><input id="username" autoComplete="username" className="input" value={form.username} onChange={set('username')} /></Field>
        <Field label="Email" id="email"><input id="email" type="email" autoComplete="email" className="input" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" id="password" hint="At least 8 characters"><input id="password" type="password" autoComplete="new-password" className="input" value={form.password} onChange={set('password')} /></Field>
        {error && <p role="alert" className="text-sm text-bad">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !valid}>{busy && <Spinner />}Create account</button>
      </form>
    </AuthShell>
  );
}

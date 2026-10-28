import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, applyTheme } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';
import { LANGS, fmtDate } from '../lib/format.js';
import { Badge, Field, PageHeader, Spinner } from '../components/ui.jsx';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(user.theme);
  const [lang, setLang] = useState(user.preferredLanguage);
  const [busy, setBusy] = useState(false);
  const dirty = theme !== user.theme || lang !== user.preferredLanguage;

  const save = async () => {
    setBusy(true);
    try { const d = await api.patch('/auth/me', { theme, preferredLanguage: lang }); setUser(d.user); toast.success('Settings saved'); }
    catch (e) { applyTheme(user.theme); toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Profile and settings" />
      <div className="grid max-w-3xl gap-6">
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Account</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-mute">Username</dt><dd className="font-medium">{user.username}</dd></div>
            <div><dt className="text-mute">Email</dt><dd className="font-medium">{user.email}</dd></div>
            <div><dt className="text-mute">Role</dt><dd><Badge tone={user.role === 'admin' ? 'good' : 'mute'}>{user.role === 'admin' ? 'Admin' : 'Participant'}</Badge></dd></div>
            <div><dt className="text-mute">Joined</dt><dd className="font-medium">{fmtDate(user.createdAt)}</dd></div>
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Preferences</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Theme" id="theme"><select id="theme" className="input" value={theme} onChange={(e) => { setTheme(e.target.value); applyTheme(e.target.value); }}><option value="dark">Dark</option><option value="light">Light</option></select></Field>
            <Field label="Default language" id="plang" hint="Used when you open a problem"><select id="plang" className="input" value={lang} onChange={(e) => setLang(e.target.value)}>{LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select></Field>
          </div>
          <button className="btn-primary mt-4" onClick={save} disabled={!dirty || busy}>{busy && <Spinner />}Save changes</button>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">Session</h2>
          <button className="btn-ghost" onClick={async () => { try { await logout(); navigate('/login'); } catch (e) { toast.error(e.message); } }}>Log out</button>
        </section>
      </div>
    </>
  );
}

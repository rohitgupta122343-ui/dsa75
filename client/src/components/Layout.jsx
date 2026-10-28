import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ListChecks, History, Trophy, UserCog, ShieldCheck, FilePlus2, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth, applyTheme } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api } from '../lib/api.js';

const main = [
  ['/', 'Dashboard', LayoutDashboard, true],
  ['/challenge', 'Calendar', CalendarDays],
  ['/problems', 'Problems', ListChecks],
  ['/submissions', 'Submissions', History],
  ['/leaderboard', 'Leaderboard', Trophy],
  ['/profile', 'Profile', UserCog],
];
const admin = [
  ['/admin', 'Admin overview', ShieldCheck, true],
  ['/admin/questions', 'Manage questions', FilePlus2],
];

function Nav({ items, onNavigate }) {
  return items.map(([to, label, Icon, end]) => (
    <NavLink key={to} to={to} end={end} onClick={onNavigate}
      className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-accent/15 text-accent' : 'text-mute hover:bg-raised hover:text-fg'}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />{label}
    </NavLink>
  ));
}

export default function Layout() {
  const { user, isAdmin, logout, setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const toggleTheme = async () => {
    const next = user.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { const d = await api.patch('/auth/me', { theme: next }); setUser(d.user); } catch (e) { applyTheme(user.theme); toast.error(e.message); }
  };
  const doLogout = async () => { try { await logout(); navigate('/login'); } catch (e) { toast.error(e.message); } };

  const sidebar = (
    <div className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 grid-cols-2 gap-0.5 rounded-lg bg-raised p-1.5" aria-hidden="true"><i className="rounded-sm bg-accent" /><i className="rounded-sm bg-accent/40" /><i className="rounded-sm bg-accent/40" /><i className="rounded-sm bg-accent" /></span>
        <span className="font-bold leading-tight">75 Days<br />DSA Challenge</span>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Main"><Nav items={main} onNavigate={() => setOpen(false)} /></nav>
      {isAdmin && (<><p className="mt-5 px-3 pb-1 text-xs text-mute">Admin</p><nav className="flex flex-col gap-1" aria-label="Admin"><Nav items={admin} onNavigate={() => setOpen(false)} /></nav></>)}
      <div className="mt-auto space-y-1 border-t border-line pt-3">
        <p className="truncate px-3 text-sm font-semibold">{user.username}</p>
        <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-mute hover:bg-raised hover:text-fg">
          {user.theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}{user.theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-mute hover:bg-raised hover:text-bad"><LogOut className="h-4 w-4" />Log out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-panel lg:block">{sidebar}</aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-panel px-4 py-3 lg:hidden">
        <span className="font-bold">75 Days DSA</span>
        <button onClick={() => setOpen(true)} aria-label="Open navigation" className="btn-ghost px-2.5"><Menu className="h-5 w-5" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-y-0 left-0 w-64 bg-panel shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3 text-mute"><X className="h-5 w-5" /></button>
            {sidebar}
          </div>
        </div>
      )}
      <main className="min-w-0 p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  );
}

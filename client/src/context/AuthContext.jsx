import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function applyTheme(theme) { document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark'); }

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [booting, setBooting] = useState(true);

  const setUser = useCallback((u) => { setUserState(u); if (u) applyTheme(u.theme); }, []);

  useEffect(() => {
    api.get('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setBooting(false));
    const expired = () => setUserState(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [setUser]);

  const login = async (email, password) => { const d = await api.post('/auth/login', { email, password }); setUser(d.user); return d.user; };
  const register = async (username, email, password) => { const d = await api.post('/auth/register', { username, email, password }); setUser(d.user); return d.user; };
  const logout = async () => { try { await api.post('/auth/logout'); } finally { setUserState(null); } };

  // `isAdmin` only drives which links are shown. The API enforces permissions on every request.
  return <Ctx.Provider value={{ user, booting, isAdmin: user?.role === 'admin', login, register, logout, setUser }}>{children}</Ctx.Provider>;
}

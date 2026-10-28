import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './ui.jsx';

export function Splash() { return <div className="grid h-full place-items-center"><Spinner className="h-6 w-6" /></div>; }

export function RequireAuth() {
  const { user, booting } = useAuth();
  const loc = useLocation();
  if (booting) return <Splash />;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}
// UI convenience only: the API rejects non-admins with 403 regardless.
export function RequireAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
export function GuestOnly() {
  const { user, booting } = useAuth();
  if (booting) return <Splash />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

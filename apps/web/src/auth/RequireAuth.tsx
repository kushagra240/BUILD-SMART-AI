import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/** Gate for /app/* routes: waits for bootstrap, then redirects guests to login. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div
        role="status"
        className="min-h-[40vh] flex items-center justify-center px-4 py-12 text-sm text-ink-soft"
      >
        Checking your session…
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

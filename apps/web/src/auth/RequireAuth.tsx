import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';

/** Gate for /app/* routes: waits for bootstrap, then redirects guests to login. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (status === 'loading') {
    return (
      <div
        role="status"
        className="min-h-[40vh] flex items-center justify-center px-4 py-12 text-sm text-ink-soft"
      >
        {t('auth.checkingSession')}
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

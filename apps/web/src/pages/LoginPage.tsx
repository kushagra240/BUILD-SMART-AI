import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiError, isMockApi } from '../services/apiClient';
import { useAuth } from '../auth/useAuth';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { AuthShell } from '../components/layout/AuthShell';

function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t('auth.shared.errors.emailInvalid')),
    password: z.string().min(10, t('auth.shared.errors.passwordMin')),
  });
}

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

const mockDefaults: LoginFormData = {
  email: 'aniket@buildsmart.local',
  password: 'password12345',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const mock = isMockApi();
  const { t } = useTranslation();
  const loginSchema = createLoginSchema(t);

  const from = (
    location.state as {
      from?: { pathname?: string; search?: string };
    } | null
  )?.from;
  const redirectTo = from?.pathname
    ? `${from.pathname}${from.search ?? ''}`
    : '/app/projects';

  const [formData, setFormData] = useState<LoginFormData>(() =>
    mock ? mockDefaults : { email: '', password: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  const applyApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      const mapped: Partial<Record<keyof LoginFormData, string>> = {};
      for (const [field, message] of Object.entries(error.fieldErrors())) {
        if (field === 'email' || field === 'password') {
          mapped[field] = message;
        }
      }
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
        return;
      }
      setApiError(error.message);
      return;
    }
    setApiError(error instanceof Error ? error.message : t('auth.login.failed'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0] as keyof LoginFormData] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await login(formData);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      applyApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-[-0.05em] text-ink sm:text-3xl">
              {t('auth.login.title')}
            </h1>
            {mock && <SampleDataBadge text={t('common.mockAuth')} variant="subtle" />}
          </div>
          <p className="text-sm leading-6 text-ink-soft">{t('auth.login.subtitle')}</p>
        </header>

        <div className="surface-card p-6 sm:p-7">
          {apiError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-error/25 bg-error/5 px-3.5 py-2.5 text-xs text-error"
            >
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-ink">
                {t('auth.shared.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`field-input h-11 ${
                  errors.email ? 'border-error ring-2 ring-error/15' : ''
                }`}
                placeholder={t('auth.shared.emailPlaceholder')}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-[11px] font-semibold text-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="password" className="block text-xs font-semibold text-ink">
                  {t('auth.shared.passwordLabel')}
                </label>
                <span className="text-[10px] text-ink-soft">
                  {t('auth.shared.passwordMinHint')}
                </span>
              </div>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`field-input h-11 font-mono ${
                  errors.password ? 'border-error ring-2 ring-error/15' : ''
                }`}
                placeholder={t('auth.shared.passwordPlaceholder')}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-[11px] font-semibold text-error">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="btn-primary h-11 w-full"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>{loading ? t('auth.login.submitting') : t('auth.login.submit')}</span>
            </button>
          </form>

          {mock && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-4 text-[11px] text-ink-soft">
              <span>{t('auth.login.demoMode')}</span>
              <span className="rounded bg-paper-deep px-2 py-1 font-mono text-ink">
                {mockDefaults.email}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 text-xs text-ink-soft">
          <div>
            {t('auth.login.footerPrompt')}{' '}
            <Link
              to="/register"
              className="rounded font-bold text-accent hover:underline focus-ring"
            >
              {t('auth.login.footerLink')}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>{t('auth.shared.securityLogin')}</span>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

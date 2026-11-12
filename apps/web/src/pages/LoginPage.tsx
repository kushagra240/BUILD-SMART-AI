import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { Home, LogIn, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiError, isMockApi } from '../services/apiClient';
import { useAuth } from '../auth/useAuth';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 bg-paper text-ink">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-paper-deep border border-ink/14 text-forest mb-1">
            <Home className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-ink">
              {t('auth.login.title')}
            </h1>
            {mock && <SampleDataBadge text={t('common.mockAuth')} variant="subtle" />}
          </div>
          <p className="text-xs text-ink-soft">{t('auth.login.subtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-6 sm:p-8 shadow-card space-y-5">
          {apiError && (
            <div
              role="alert"
              className="p-3 text-xs bg-error/10 border border-error/20 text-error rounded-md"
            >
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-ink">
                {t('auth.shared.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-sans focus-ring ${
                  errors.email ? 'border-2 border-error' : 'border border-ink/14'
                }`}
                placeholder={t('auth.shared.emailPlaceholder')}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-[11px] text-error font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-medium text-ink">
                  {t('auth.shared.passwordLabel')}
                </label>
                <span className="text-[10px] text-ink-soft font-mono">
                  {t('auth.shared.passwordMinHint')}
                </span>
              </div>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-mono focus-ring ${
                  errors.password ? 'border-2 border-error' : 'border border-ink/14'
                }`}
                placeholder={t('auth.shared.passwordPlaceholder')}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-[11px] text-error font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? t('auth.login.submitting') : t('auth.login.submit')}</span>
            </button>
          </form>

          {mock && (
            <div className="pt-3 border-t border-ink/10 text-[11px] text-ink-soft flex items-center justify-between">
              <span>{t('auth.login.demoMode')}</span>
              <span className="font-mono text-ink">{mockDefaults.email}</span>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-ink-soft space-y-2">
          <div>
            {t('auth.login.footerPrompt')}{' '}
            <Link to="/register" className="font-semibold text-brick hover:underline">
              {t('auth.login.footerLink')}
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-ink-soft">
            <ShieldCheck className="w-3.5 h-3.5 text-forest" />
            <span>{t('auth.shared.securityLogin')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

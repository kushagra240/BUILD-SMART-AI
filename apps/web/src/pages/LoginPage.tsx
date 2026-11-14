import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiError, isMockApi } from '../services/apiClient';
import { useAuth } from '../auth/useAuth';
import { AuthShell } from '../components/layout/AuthShell';
import { Glyph } from '../components/common/Glyph';

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
  const isSafeRedirect =
    from?.pathname &&
    !from.pathname.startsWith('/login') &&
    !from.pathname.startsWith('/register');
  const redirectTo = isSafeRedirect
    ? `${from.pathname}${from.search ?? ''}`
    : '/app/projects';

  const [formData, setFormData] = useState<LoginFormData>(() =>
    mock ? mockDefaults : { email: '', password: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

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
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <p className="app-eyebrow">Welcome back</p>
        <div className="flex items-center gap-2">
          <h2>{t('auth.login.title')}</h2>
        </div>
        <p className="auth-intro">{t('auth.login.subtitle')}</p>

        {apiError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error/25 bg-error/5 px-3.5 py-2.5 text-xs text-error"
          >
            {apiError}
          </div>
        )}

        <label htmlFor="email">
          {t('auth.shared.emailLabel')}
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t('auth.shared.emailPlaceholder')}
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            required
          />
        </label>
        {errors.email && (
          <p id="email-error" className="mt-1 text-[11px] font-semibold text-error">
            {errors.email}
          </p>
        )}

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label htmlFor="password">{t('auth.shared.passwordLabel')}</label>
            <span className="text-[10px] text-ink-soft">
              {t('auth.shared.passwordMinHint')}
            </span>
          </div>
          <span className="password-field">
            <input
              id="password"
              type={visible ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('auth.shared.passwordPlaceholder')}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              required
            />
            <button type="button" onClick={() => setVisible(!visible)}>
              {visible ? 'Hide' : 'Show'}
            </button>
          </span>
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1 text-[11px] font-semibold text-error">
            {errors.password}
          </p>
        )}

        <div className="auth-options">
          <label>
            <input type="checkbox" /> Remember me
          </label>
          <button type="button">Forgot password?</button>
        </div>

        <button
          className="auth-submit"
          type="submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? t('auth.login.submitting') : t('auth.login.submit')} <Glyph name="arrow" size={16} />
        </button>

        {mock && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[11px] text-ink-soft">
            <span>{t('auth.login.demoMode')}</span>
            <span className="rounded bg-paper-deep px-2 py-0.5 font-mono text-ink">
              {mockDefaults.email}
            </span>
          </div>
        )}

        <p className="auth-switch">
          {t('auth.login.footerPrompt')}{' '}
          <Link to="/register">{t('auth.login.footerLink')}</Link>
        </p>
      </form>
    </AuthShell>
  );
}

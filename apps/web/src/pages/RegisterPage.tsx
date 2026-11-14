import { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiError, isMockApi } from '../services/apiClient';
import { useAuth } from '../auth/useAuth';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { AuthShell } from '../components/layout/AuthShell';
import { Glyph } from '../components/common/Glyph';

function createRegisterSchema(t: TFunction) {
  return z
    .object({
      full_name: z.string().min(2, t('auth.register.errors.fullNameMin')),
      email: z.string().email(t('auth.shared.errors.emailInvalid')),
      password: z.string().min(10, t('auth.shared.errors.passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.register.errors.passwordMismatch'),
      path: ['confirmPassword'],
    });
}

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

const mockDefaults: RegisterFormData = {
  full_name: 'Aniket Deshmukh',
  email: 'aniket@buildsmart.local',
  password: 'password12345',
  confirmPassword: 'password12345',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, status } = useAuth();
  const mock = isMockApi();
  const { t } = useTranslation();
  const registerSchema = createRegisterSchema(t);

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

  const [formData, setFormData] = useState<RegisterFormData>(() =>
    mock ? mockDefaults : { full_name: '', email: '', password: '', confirmPassword: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
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
      const mapped: Partial<Record<keyof RegisterFormData, string>> = {};
      for (const [field, message] of Object.entries(error.fieldErrors())) {
        if (field === 'full_name' || field === 'email' || field === 'password') {
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
    setApiError(error instanceof Error ? error.message : t('auth.register.failed'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          formattedErrors[issue.path[0] as keyof RegisterFormData] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
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
        <p className="app-eyebrow">Create your workspace</p>
        <div className="flex items-center gap-2">
          <h2>{t('auth.register.title')}</h2>
          {mock && <SampleDataBadge text={t('common.mockAuth')} variant="subtle" />}
        </div>
        <p className="auth-intro">{t('auth.register.subtitle')}</p>

        {apiError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-error/25 bg-error/5 px-3.5 py-2.5 text-xs text-error"
          >
            {apiError}
          </div>
        )}

        <label htmlFor="full_name">
          {t('auth.register.fullNameLabel')}
          <input
            id="full_name"
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder={t('auth.register.fullNamePlaceholder')}
            autoComplete="name"
            aria-invalid={Boolean(errors.full_name)}
            aria-describedby={errors.full_name ? 'full_name-error' : undefined}
            required
          />
        </label>
        {errors.full_name && (
          <p id="full_name-error" className="mt-1 text-[11px] font-semibold text-error">
            {errors.full_name}
          </p>
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
              autoComplete="new-password"
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

        <label htmlFor="confirmPassword">
          {t('auth.register.confirmPasswordLabel')}
          <span className="password-field">
            <input
              id="confirmPassword"
              type={visible ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder={t('auth.shared.passwordPlaceholder')}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
              required
            />
          </span>
        </label>
        {errors.confirmPassword && (
          <p id="confirm-password-error" className="mt-1 text-[11px] font-semibold text-error">
            {errors.confirmPassword}
          </p>
        )}

        <button
          className="auth-submit mt-6"
          type="submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}{' '}
          <Glyph name="arrow" size={16} />
        </button>

        <p className="auth-switch">
          {t('auth.register.footerPrompt')}{' '}
          <Link to="/login">{t('auth.register.footerLink')}</Link>
        </p>
      </form>
    </AuthShell>
  );
}

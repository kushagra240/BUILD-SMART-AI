import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { ApiError, isMockApi } from '../services/apiClient';
import { useAuth } from '../auth/useAuth';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { AuthShell } from '../components/layout/AuthShell';

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
  const { register, status } = useAuth();
  const mock = isMockApi();
  const { t } = useTranslation();
  const registerSchema = createRegisterSchema(t);

  const [formData, setFormData] = useState<RegisterFormData>(() =>
    mock ? mockDefaults : { full_name: '', email: '', password: '', confirmPassword: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/app/projects" replace />;
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
      navigate('/app/projects', { replace: true });
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
              {t('auth.register.title')}
            </h1>
            {mock && <SampleDataBadge text={t('common.mockAuth')} variant="subtle" />}
          </div>
          <p className="text-sm leading-6 text-ink-soft">{t('auth.register.subtitle')}</p>
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
              <label htmlFor="full_name" className="block text-xs font-semibold text-ink">
                {t('auth.register.fullNameLabel')}
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`field-input h-11 ${
                  errors.full_name ? 'border-error ring-2 ring-error/15' : ''
                }`}
                placeholder={t('auth.register.fullNamePlaceholder')}
                autoComplete="name"
                aria-invalid={Boolean(errors.full_name)}
                aria-describedby={errors.full_name ? 'full_name-error' : undefined}
              />
              {errors.full_name && (
                <p id="full_name-error" className="text-[11px] font-semibold text-error">
                  {errors.full_name}
                </p>
              )}
            </div>

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
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-[11px] font-semibold text-error">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-ink">
                {t('auth.register.confirmPasswordLabel')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`field-input h-11 font-mono ${
                  errors.confirmPassword ? 'border-error ring-2 ring-error/15' : ''
                }`}
                placeholder={t('auth.shared.passwordPlaceholder')}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? 'confirmPassword-error' : undefined
                }
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-[11px] font-semibold text-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="btn-primary h-11 w-full"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>{loading ? t('auth.register.submitting') : t('auth.register.submit')}</span>
            </button>
          </form>
        </div>

        <div className="space-y-2 text-xs text-ink-soft">
          <div>
            {t('auth.register.footerPrompt')}{' '}
            <Link
              to="/login"
              className="rounded font-bold text-accent hover:underline focus-ring"
            >
              {t('auth.register.footerLink')}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>{t('auth.shared.securityRegister')}</span>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

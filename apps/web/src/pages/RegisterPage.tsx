import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, UserPlus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(10, 'Password must be at least 10 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    full_name: 'Aniket Deshmukh',
    email: 'aniket@buildsmart.local',
    password: 'password12345',
    confirmPassword: 'password12345',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      await apiClient.register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate('/app');
      }, 500);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed');
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
              Create your notebook.
            </h1>
            <SampleDataBadge text="Mock auth" variant="subtle" />
          </div>
          <p className="text-xs text-ink-soft">
            Save estimates, compare quality tiers, and track your house project plans.
          </p>
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

          {submitted && (
            <div
              role="status"
              className="p-3 text-xs bg-forest/10 border border-forest/20 text-forest rounded-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Account created successfully. Redirecting to overview...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="block text-xs font-medium text-ink">
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-sans focus-ring ${
                  errors.full_name ? 'border-2 border-error' : 'border border-ink/14'
                }`}
                placeholder="e.g. Aniket Deshmukh"
                autoComplete="name"
              />
              {errors.full_name && (
                <p className="text-[11px] text-error font-medium">{errors.full_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-ink">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-sans focus-ring ${
                  errors.email ? 'border-2 border-error' : 'border border-ink/14'
                }`}
                placeholder="name@example.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-[11px] text-error font-medium">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-medium text-ink">
                  Password
                </label>
                <span className="text-[10px] text-ink-soft font-mono">Min 10 characters</span>
              </div>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-mono focus-ring ${
                  errors.password ? 'border-2 border-error' : 'border border-ink/14'
                }`}
                placeholder="••••••••••"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-[11px] text-error font-medium">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-ink">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-mono focus-ring ${
                  errors.confirmPassword ? 'border-2 border-error' : 'border border-ink/14'
                }`}
                placeholder="••••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-error font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full py-2.5 px-4 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating notebook...' : 'Register notebook'}</span>
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-ink-soft space-y-2">
          <div>
            Already have a notebook?{' '}
            <Link to="/login" className="font-semibold text-brick hover:underline">
              Sign in
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-ink-soft">
            <ShieldCheck className="w-3.5 h-3.5 text-forest" />
            <span>Strict privacy: No telemetry, no selling of site queries</span>
          </div>
        </div>
      </div>
    </div>
  );
}

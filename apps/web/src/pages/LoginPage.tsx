import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, LogIn, CheckCircle2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import { apiClient } from '../services/apiClient';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: 'aniket@buildsmart.local',
    password: 'password12345',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      await apiClient.login(formData);
      setSubmitted(true);
      setTimeout(() => {
        navigate('/app');
      }, 500);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed');
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
              Welcome back.
            </h1>
            <SampleDataBadge text="Mock auth" variant="subtle" />
          </div>
          <p className="text-xs text-ink-soft">
            Sign in to access your saved building notebook and project estimates.
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
              <span>Authentication successful. Redirecting to notebook...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-[11px] text-error font-medium">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || submitted}
              className="w-full py-2.5 px-4 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign in to notebook'}</span>
            </button>
          </form>

          {/* Quick Demo Credentials Tip */}
          <div className="pt-3 border-t border-ink/10 text-[11px] text-ink-soft flex items-center justify-between">
            <span>Demo mode active</span>
            <span className="font-mono text-ink">aniket@buildsmart.local</span>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-ink-soft space-y-2">
          <div>
            Don&apos;t have a building notebook yet?{' '}
            <Link to="/register" className="font-semibold text-brick hover:underline">
              Create an account
            </Link>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-ink-soft">
            <ShieldCheck className="w-3.5 h-3.5 text-forest" />
            <span>Argon2id password hashing · HTTP-only cookie rotation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

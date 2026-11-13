import { Link } from 'react-router-dom';
import { Calculator, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="app-surface flex min-h-[70vh] items-center justify-center px-4 py-16 text-ink">
      <div className="surface-card w-full max-w-lg overflow-hidden text-center">
        <div className="relative overflow-hidden bg-night px-6 py-10 text-white">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(49,94,251,0.42), transparent 58%)',
            }}
            aria-hidden="true"
          />
          <div className="relative space-y-2">
            <p className="font-headline text-6xl font-extrabold tracking-[-0.06em] text-white sm:text-7xl">
              404
            </p>
            <span className="mx-auto block h-1 w-12 rounded-full bg-accent" aria-hidden="true" />
          </div>
        </div>

        <div className="space-y-5 px-6 py-8 sm:px-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-ink">
              {t('notFound.title')}
            </h1>
            <p className="text-sm leading-6 text-ink-soft">{t('notFound.body')}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link to="/app" className="btn-primary h-10 px-4 text-xs">
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('notFound.overview')}</span>
            </Link>
            <Link to="/app/new" className="btn-ghost h-10 px-4 text-xs">
              <Calculator className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('notFound.newEstimate')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

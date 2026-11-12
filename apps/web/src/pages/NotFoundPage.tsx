import { Link } from 'react-router-dom';
import { Home, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 space-y-5 bg-paper text-ink">
      <div className="text-7xl font-headline font-bold text-brick tracking-tight">
        404
      </div>
      <div className="space-y-1.5 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-ink tracking-tight">
          {t('notFound.title')}
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft font-sans">
          {t('notFound.body')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-sans">
        <Link
          to="/app"
          className="px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle flex items-center gap-1.5 transition-colors focus-ring"
        >
          <Home className="w-3.5 h-3.5" aria-hidden="true" />
          {t('notFound.overview')}
        </Link>
        <Link
          to="/app/new"
          className="px-4 py-2 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors flex items-center gap-1.5 focus-ring"
        >
          <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
          {t('notFound.newEstimate')}
        </Link>
      </div>
    </div>
  );
}

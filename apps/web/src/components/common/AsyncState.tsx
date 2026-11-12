import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 rounded-lg border border-ink/14 bg-paper-deep/40 px-4 py-10 text-sm text-ink-soft"
    >
      <Loader2 className="w-4 h-4 animate-spin text-forest" aria-hidden="true" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-error/30 bg-error/10 px-4 py-4 text-xs text-error"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold">{t('errors.pageTitle')}</p>
          <p className="mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-start sm:self-auto px-3 py-1.5 rounded-md border border-error/40 bg-paper text-error text-xs font-medium hover:bg-error/5 focus-ring"
        >
          {t('errors.tryAgain')}
        </button>
      )}
    </div>
  );
}

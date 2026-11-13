import { useTranslation } from 'react-i18next';
import { isMockApi } from '../../services/apiClient';

export function MockBanner() {
  const { t } = useTranslation();

  if (!isMockApi()) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={t('mockBanner.aria')}
      className="flex items-center justify-center gap-2 bg-night px-4 py-1.5 text-[11px] text-white/80"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      <span className="truncate">
        <strong className="font-bold uppercase tracking-[0.1em] text-white">
          {t('mockBanner.label')}
        </strong>{' '}
        {t('mockBanner.body')}
      </span>
    </div>
  );
}

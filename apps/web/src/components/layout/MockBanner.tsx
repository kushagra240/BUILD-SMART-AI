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
      className="bg-paper-deep text-ink border-b border-ink/14 px-4 py-1.5 text-xs flex items-center justify-center gap-2 font-mono"
    >
      <span className="w-2 h-2 rounded-full bg-ochre inline-block" aria-hidden="true" />
      <span>
        <strong className="font-semibold uppercase tracking-wider text-brick">
          {t('mockBanner.label')}
        </strong>{' '}
        {t('mockBanner.body')}
      </span>
    </div>
  );
}

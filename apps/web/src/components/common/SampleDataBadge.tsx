import { useTranslation } from 'react-i18next';

interface SampleDataBadgeProps {
  className?: string;
  variant?: 'subtle' | 'pill' | 'contrast';
  text?: string;
}

export function SampleDataBadge({
  className = '',
  variant = 'pill',
  text,
}: SampleDataBadgeProps) {
  const { t } = useTranslation();
  const label = text ?? t('common.sampleData');

  if (variant === 'contrast') {
    return (
      <span
        data-testid="sample-data-badge"
        className={`inline-flex items-center rounded-md bg-night px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white ${className}`}
      >
        {label}
      </span>
    );
  }

  if (variant === 'subtle') {
    return (
      <span
        data-testid="sample-data-badge"
        className={`inline-flex items-center rounded-md border border-line bg-panel px-2 py-0.5 text-[10px] font-semibold text-ink-soft ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      data-testid="sample-data-badge"
      className={`inline-flex items-center gap-1.5 rounded-full border border-ochre/40 bg-ochre/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-ink ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ochre" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

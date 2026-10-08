interface SampleDataBadgeProps {
  className?: string;
  variant?: 'subtle' | 'pill' | 'contrast';
  text?: string;
}

export function SampleDataBadge({
  className = '',
  variant = 'pill',
  text = 'Sample data',
}: SampleDataBadgeProps) {
  if (variant === 'contrast') {
    return (
      <span
        data-testid="sample-data-badge"
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wide bg-ink text-paper uppercase ${className}`}
      >
        {text}
      </span>
    );
  }

  if (variant === 'subtle') {
    return (
      <span
        data-testid="sample-data-badge"
        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-ink-soft border border-ink/14 bg-paper-deep/60 ${className}`}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      data-testid="sample-data-badge"
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-ochre/20 text-ink border border-ochre/40 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-ochre" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

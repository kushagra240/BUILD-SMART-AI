export function MockBanner() {
  return (
    <div
      role="region"
      aria-label="Demo mode disclaimer banner"
      className="bg-paper-deep text-ink border-b border-ink/14 px-4 py-1.5 text-xs flex items-center justify-center gap-2 font-mono"
    >
      <span className="w-2 h-2 rounded-full bg-ochre inline-block" aria-hidden="true" />
      <span>
        <strong className="font-semibold uppercase tracking-wider text-brick">Demo Mode (Mock API):</strong> Running with simulated Pune planning data. All figures are round estimates.
      </span>
    </div>
  );
}

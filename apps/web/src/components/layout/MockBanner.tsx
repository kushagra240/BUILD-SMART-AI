import { AlertTriangle } from 'lucide-react';

export function MockBanner() {
  return (
    <div
      role="region"
      aria-label="Demo mode disclaimer banner"
      className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-inner"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-950" aria-hidden="true" />
      <span>
        <strong className="uppercase tracking-wider">Demo Mode (Mock Data):</strong> All cost estimates, rates, and recommendations are simulated placeholders. No real backend connected yet.
      </span>
    </div>
  );
}

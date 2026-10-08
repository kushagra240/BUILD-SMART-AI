import { Link } from 'react-router-dom';
import { Home, Calculator } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 space-y-5 bg-paper text-ink">
      <div className="text-7xl font-headline font-bold text-brick tracking-tight">
        404
      </div>
      <div className="space-y-1.5 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-headline font-bold text-ink tracking-tight">
          Page not found in your notebook.
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft font-sans">
          The requested page does not exist or has been moved. Use the options below to return to your saved estimates.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 font-sans">
        <Link
          to="/app"
          className="px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle flex items-center gap-1.5 transition-colors focus-ring"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Project overview</span>
        </Link>
        <Link
          to="/app/new"
          className="px-4 py-2 rounded-md bg-paper-deep hover:bg-clay text-ink text-xs font-medium border border-ink/14 flex items-center gap-1.5 transition-colors focus-ring"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>New estimate</span>
        </Link>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 space-y-6">
      <div className="text-6xl font-extrabold text-amber-500 font-mono">404</div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
      <p className="text-sm text-slate-600 max-w-md">
        The requested page does not exist or has been moved. Use the options below to navigate back to safety.
      </p>
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          to="/app/new"
          className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors"
        >
          <span>Estimate Wizard</span>
        </Link>
      </div>
    </div>
  );
}

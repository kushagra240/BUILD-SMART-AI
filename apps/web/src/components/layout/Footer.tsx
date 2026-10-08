import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ink/14 bg-paper text-ink-soft py-6 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-ink">
            <span className="font-headline font-semibold">BuildSmart AI</span>
            <span className="text-ink-soft">·</span>
            <span className="text-ink-soft">Thoughtful budgets, before you build.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-soft">
            <Link to="/methodology" className="hover:text-ink transition-colors">
              Methodology
            </Link>
            <span aria-hidden="true">·</span>
            <span>Pune Region (P10–P90 Ranges)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-ink">Indicative estimates · Not a contractor quotation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

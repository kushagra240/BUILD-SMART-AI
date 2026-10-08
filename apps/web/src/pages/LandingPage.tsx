import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, ShieldCheck, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="pt-8 sm:pt-14 pb-12 border-b border-ink/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                YOUR BUILDING NOTEBOOK · PUNE REGION
              </span>
              <SampleDataBadge text="Sample data · Prototype" />
            </div>

            <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.12]">
              Intelligent Construction Cost Estimation for{' '}
              <span className="text-brick italic font-serif">Pune Homes.</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
              Enter your built-up area, floors, zone, and quality tier. Get a transparent total cost estimate
              with honest ranges, a 9-category breakdown, practical material recommendations, and a downloadable PDF.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
              <Link
                to="/app/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-brick hover:bg-brick-hover text-paper font-medium text-sm shadow-subtle transition-colors focus-ring"
              >
                <Calculator className="w-4 h-4" aria-hidden="true" />
                <span>Start 4-Step Estimate Wizard</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-paper-deep hover:bg-clay text-ink font-medium text-sm border border-ink/14 transition-colors focus-ring"
              >
                <span>View Project Overview</span>
              </Link>
              <Link
                to="/methodology"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-ink-soft hover:text-ink text-sm transition-colors focus-ring"
              >
                <span>Methodology & Data</span>
              </Link>
            </div>

            {/* Quick Highlights Bar */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-ink/10 text-xs text-ink-soft font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <span>9 Cost Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <span>Indian ₹ Formatting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <span>P10–P90 Range Bands</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature / Principles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-ink-soft">
              HOW BUILDSMART WORKS
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-ink">
              Three approaches, one sound foundation.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-forest/10 border border-forest/20 text-forest flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-headline text-lg font-bold text-ink">
                9-Category Cost Allocation
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans">
                Predicts realistic cost distributions across Foundation, RCC Structure, Masonry, Openings, Flooring, Services, and Contingency.
              </p>
            </div>

            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-brick/10 border border-brick/20 text-brick flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-headline text-lg font-bold text-ink">
                Pune Zone Calibration
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans">
                Accounts for local micro-market logistics and rate factors across Baner, Kothrud, Wagholi, Bavdhan, and PCMC.
              </p>
            </div>

            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-ochre/20 border border-ochre/40 text-ink flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-ink" />
              </div>
              <h3 className="font-headline text-lg font-bold text-ink">
                Honest Planning Ranges
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans">
                Displays statistical confidence intervals (P10 to P90), so you understand possible cost variations before drawings are finalized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Before You Commit Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-clay/50 border border-ink/14 rounded-lg p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="font-headline text-xl font-bold text-ink">
              Before you commit to a budget
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed font-sans">
              Keep a contingency before you commit. Site conditions, soil tests, and final architectural drawings can change costs. Land, statutory approvals, professional fees, and external works are outside these estimates.
            </p>
          </div>
          <Link
            to="/materials"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-paper border border-ink/14 text-ink hover:bg-paper-deep text-xs font-medium transition-colors whitespace-nowrap focus-ring"
          >
            <span>Read material guide</span>
            <ArrowRight className="w-3.5 h-3.5 text-brick" />
          </Link>
        </div>
      </section>
    </div>
  );
}

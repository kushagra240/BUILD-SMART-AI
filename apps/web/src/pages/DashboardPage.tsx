import { Link } from 'react-router-dom';
import { Plus, ArrowRight, FileText, ChevronRight, Lightbulb } from 'lucide-react';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Top Header & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                YOUR BUILDING NOTEBOOK
              </span>
              <SampleDataBadge text="Sample data" />
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              A starting point for your building budget.
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              Welcome back, Aniket. Make room for the home you have in mind.
            </p>
          </div>

          <Link
            to="/app/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors whitespace-nowrap focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span>Start a new estimate</span>
          </Link>
        </div>

        {/* Latest Saved Estimate Hero Card (Figma Screenshot 1 Left) */}
        <div className="bg-paper-deep/60 border border-ink/14 rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-card">
          {/* Left Details */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
                  LATEST SAVED ESTIMATE
                </span>
                <span className="px-2 py-0.5 rounded bg-clay border border-ink/14 text-[11px] text-ink">
                  Standard · G+1
                </span>
              </div>

              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-ink">
                Deshmukh residence
              </h2>
              <p className="text-xs text-ink-soft">
                Baner, Pune · 1,800 sq ft total built-up · Updated 07 Oct 2026
              </p>
            </div>

            {/* Figures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-ink/10 py-4">
              <div>
                <div className="font-headline text-3xl sm:text-4xl font-bold text-brick tracking-tight">
                  ₹43,20,000
                </div>
                <div className="text-[11px] text-ink-soft">Indicative construction budget</div>
              </div>

              <div>
                <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
                  ₹2,400 <span className="text-xs font-sans font-normal text-ink-soft">/ sq ft</span>
                </div>
                <div className="text-[11px] text-ink-soft">Illustrative planning rate</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/app/projects/deshmukh-residence"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
              >
                <span>&gt; Open project</span>
              </Link>
              <Link
                to="/pdf"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
              >
                <FileText className="w-3.5 h-3.5 text-ink-soft" />
                <span>View PDF report</span>
              </Link>
            </div>
          </div>

          {/* Right Image / Architectural Vignette */}
          <div className="lg:col-span-5 bg-clay/40 border-t lg:border-t-0 lg:border-l border-ink/14 flex flex-col justify-between p-6">
            <div className="w-full h-48 sm:h-56 rounded-md overflow-hidden bg-forest/5 border border-ink/14 flex flex-col items-center justify-center p-4 relative">
              <svg
                viewBox="0 0 240 140"
                className="w-full h-full max-h-48 text-forest"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="210" cy="30" r="14" fill="#D9A441" fillOpacity="0.25" stroke="#D9A441" strokeWidth="1" />
                <path d="M190 85 C190 70, 210 65, 215 75 C220 65, 235 70, 235 85 Z" fill="#1F4D45" fillOpacity="0.15" stroke="none" />
                <rect x="25" y="45" width="165" height="75" fill="#E8DCC7" fillOpacity="0.6" stroke="#1F2421" strokeOpacity="0.4" />
                <polygon points="15,45 110,25 200,45" fill="#B4472B" fillOpacity="0.15" stroke="#B4472B" strokeWidth="1.5" />
                <rect x="35" y="55" width="60" height="25" fill="#FFFFFF" stroke="#1F4D45" strokeOpacity="0.5" />
                <line x1="35" y1="70" x2="95" y2="70" stroke="#1F4D45" strokeOpacity="0.3" strokeDasharray="2 2" />
                <rect x="110" y="80" width="30" height="40" fill="#B4472B" fillOpacity="0.2" stroke="#B4472B" />
                <rect x="148" y="80" width="32" height="25" fill="#FFFFFF" stroke="#1F4D45" strokeOpacity="0.5" />
                <line x1="10" y1="120" x2="230" y2="120" stroke="#1F2421" strokeOpacity="0.3" />
                <circle cx="30" cy="115" r="5" fill="#3F7D4E" fillOpacity="0.3" stroke="#3F7D4E" />
                <circle cx="195" cy="115" r="7" fill="#3F7D4E" fillOpacity="0.3" stroke="#3F7D4E" />
              </svg>
            </div>
            <p className="text-[11px] text-ink-soft text-center pt-2 font-sans italic">
              A home begins with a plan. Reference image, not your proposed design.
            </p>
          </div>
        </div>

        {/* 3 Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              Saved projects
            </div>
            <div className="font-headline text-3xl sm:text-4xl font-bold text-ink">
              04
            </div>
            <p className="text-xs text-ink-soft">Four estimates, kept together</p>
          </div>

          <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              Latest planning range
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-forest">
              ₹38.88–47.52 lakh
            </div>
            <p className="text-xs text-ink-soft">Deshmukh residence · ±10% of estimate</p>
          </div>

          <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              Contingency included
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-ink">
              5% reserve
            </div>
            <p className="text-xs text-ink-soft">₹2,16,000 within your latest estimate</p>
          </div>
        </div>

        {/* Two-Column Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Recent Estimates List */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-center justify-between border-b border-ink/14 pb-2">
              <h2 className="font-headline text-xl font-bold text-ink">
                Recent estimates
              </h2>
              <Link
                to="/app/projects"
                className="text-xs font-medium text-brick hover:underline inline-flex items-center gap-1"
              >
                <span>View all projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="border border-ink/14 rounded-lg overflow-hidden divide-y divide-ink/10 bg-paper">
              <Link
                to="/app/projects/deshmukh-residence"
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper-deep/40 transition-colors group"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-sm text-ink group-hover:text-brick transition-colors">
                    Deshmukh residence
                  </div>
                  <div className="text-xs text-ink-soft">
                    Baner · 1,800 sq ft · Standard
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono font-semibold text-sm text-ink">
                    ₹43,20,000
                  </span>
                  <span className="text-xs font-mono text-ink-soft">07 Oct 2026</span>
                  <ChevronRight className="w-4 h-4 text-ink-soft group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>

              <Link
                to="/app/projects"
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper-deep/40 transition-colors group"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-sm text-ink group-hover:text-brick transition-colors">
                    Kulkarni family home
                  </div>
                  <div className="text-xs text-ink-soft">
                    Kothrud · 1,500 sq ft · Standard
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono font-semibold text-sm text-ink">
                    ₹36,00,000
                  </span>
                  <span className="text-xs font-mono text-ink-soft">04 Oct 2026</span>
                  <ChevronRight className="w-4 h-4 text-ink-soft group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>

              <Link
                to="/app/projects"
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-paper-deep/40 transition-colors group"
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-sm text-ink group-hover:text-brick transition-colors">
                    Wagholi courtyard home
                  </div>
                  <div className="text-xs text-ink-soft">
                    Wagholi · 1,200 sq ft · Economy
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-mono font-semibold text-sm text-ink">
                    ₹24,00,000
                  </span>
                  <span className="text-xs font-mono text-ink-soft">28 Sep 2026</span>
                  <ChevronRight className="w-4 h-4 text-ink-soft group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </div>

            <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-4 flex gap-3 items-start text-xs text-ink-soft">
              <Lightbulb className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-ink">New to your notebook?</strong> Start with your total built-up area. You can refine material choices before saving a report.
              </p>
            </div>
          </div>

          {/* Right Column: Before you commit */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-clay/50 border border-ink/14 rounded-lg p-5 space-y-3">
              <h3 className="font-headline text-lg font-bold text-ink">
                Before you commit
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed">
                Keep a contingency before you commit. Site conditions and final drawings can change your budget.
              </p>
              <p className="text-[11px] text-ink-soft leading-relaxed border-t border-ink/10 pt-2">
                Land, statutory approvals, professional fees and external works are outside these estimates.
              </p>
              <Link
                to="/materials"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brick hover:underline pt-1"
              >
                <span>Read the material guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

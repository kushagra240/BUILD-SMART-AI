import { Link } from 'react-router-dom';
import { Layers, ShieldCheck, Database, ArrowRight } from 'lucide-react';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

const CATEGORIES = [
  { name: 'Foundation', share: '12%', color: '#6B4F3A', desc: 'Site clearance, excavation, footings, plinth beam and backfilling' },
  { name: 'Structure', share: '31%', color: '#1F4D45', desc: 'Columns, beams, slabs, concrete grades and reinforcement steel' },
  { name: 'Masonry', share: '18%', color: '#B4472B', desc: 'External & internal walls, AAC blockwork or brickwork, and plastering' },
  { name: 'Flooring', share: '10%', color: '#D9A441', desc: 'Vitrified tiles, ceramic floor tiles, skirting, and waterproofing substrates' },
  { name: 'Roofing & Openings', share: '10%', color: '#8A6FA0', desc: 'uPVC/aluminium windows, flush doors, hardware, and terrace parapet' },
  { name: 'Electrical', share: '7%', color: '#9BB05A', desc: 'Concealed copper wiring, distribution boards, modular switches, and earthing' },
  { name: 'Plumbing', share: '7%', color: '#4F86A6', desc: 'CPVC water supply, PVC drainage, soil waste pipes, and sanitary fixtures' },
  { name: 'Finishing', share: '7%', color: '#D88C9A', desc: 'Interior primer and washable emulsion, exterior weather coat, and touch-ups' },
  { name: 'Labour & Contingency', share: '5%', color: '#3A3F3C', desc: 'General site allowance, minor variation reserve, and unexpected contingencies' },
];

export function MethodologyPage() {
  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-ink/10 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
              DOCUMENTATION & TRANSPARENCY
            </span>
            <SampleDataBadge text="Sample data" />
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            Estimation Methodology & Data Strategy
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-2xl font-sans">
            Learn how BuildSmart AI models residential construction costs, allocates 9-category breakdowns, and maintains provenance without fabricating market data.
          </p>
        </div>

        {/* Estimation Engine Architecture */}
        <section className="bg-paper-deep/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-clay border border-ink/14 flex items-center justify-center text-forest">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="font-headline text-xl font-bold text-ink">
              Estimation Engine Architecture
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-sans">
            The core prediction pipeline models <code className="bg-paper px-1.5 py-0.5 rounded font-mono text-brick border border-ink/10">log(total_cost_inr)</code> from primary architectural attributes: total built-up area, number of floors, Pune micro-zone location multiplier, and selected quality tier. It produces an indicative median estimate (P50) alongside 80% empirical quantile bounds (P10 to P90).
          </p>
        </section>

        {/* Data Provenance Section */}
        <section className="bg-paper-deep/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-clay border border-ink/14 flex items-center justify-center text-forest">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="font-headline text-xl font-bold text-ink">
              Data Strategy & Provenance Tags
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-sans">
            In strict accordance with project honesty rules, every record in our datasets carries explicit provenance metadata:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-paper border border-ink/14 rounded p-3 space-y-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-forest text-paper">
                real_project
              </span>
              <p className="text-[11px] text-ink-soft">
                Actual completed Pune residential projects used exclusively for gold evaluation holdout.
              </p>
            </div>
            <div className="bg-paper border border-ink/14 rounded p-3 space-y-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-clay text-ink border border-ink/14">
                published_rate_derived
              </span>
              <p className="text-[11px] text-ink-soft">
                Rates derived from published municipal Schedule of Rates (SoR) and verified CPWD/PMC publications.
              </p>
            </div>
            <div className="bg-paper border border-ink/14 rounded p-3 space-y-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-ochre/30 text-ink">
                synthetic
              </span>
              <p className="text-[11px] text-ink-soft">
                Transparently labeled noise augmentation for range bounds validation (never presented as real).
              </p>
            </div>
          </div>
        </section>

        {/* 9 Categories Allocation */}
        <section className="bg-paper-deep/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <h2 className="font-headline text-xl font-bold text-ink">
              Nine Cost Breakdown Categories
            </h2>
            <span className="text-xs font-mono text-ink-soft">100% Total Sum</span>
          </div>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="bg-paper border border-ink/14 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-ink">{cat.name}</span>
                  <span className="text-ink-soft text-[11px] hidden sm:inline">— {cat.desc}</span>
                </div>
                <span className="font-mono font-bold text-ink text-right">{cat.share}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Honest Limitations & Scope */}
        <section className="bg-clay/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-3 font-sans">
          <h2 className="font-headline text-lg font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest" />
            <span>Scope Boundaries & Professional Disclaimer</span>
          </h2>
          <p className="text-xs text-ink-soft leading-relaxed">
            BuildSmart AI provides preliminary planning guidance for Pune residential builds. It is strictly not a replacement for professional civil/structural calculations, architectural working drawings, soil tests, or binding contractor quotations.
          </p>
          <div className="pt-2">
            <Link
              to="/app/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
            >
              <span>Try estimate wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

import { Link, useParams } from 'react-router-dom';
import { FileText, Edit3, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { HouseSchematic } from '../components/common/HouseSchematic';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { formatINR, formatNumber } from '../lib/formatters';

export function SavedProjectDetailPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                SAVED PROJECTS / BS-2026-004
              </span>
              <SampleDataBadge text="Sample data" />
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              Deshmukh residence
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              Baner, Pune · Saved 07 Oct 2026 · Revision 1
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/pdf"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View PDF report</span>
            </Link>
            <Link
              to="/app/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
            >
              <Edit3 className="w-3.5 h-3.5 text-ink-soft" />
              <span>Revise estimate</span>
            </Link>
          </div>
        </div>

        {/* Hero Stat Box */}
        <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
              CURRENT SAVED ESTIMATE
            </span>
            <span className="px-2 py-0.5 rounded bg-clay border border-ink/14 text-[11px] text-ink">
              SAVED · REVISION 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
            <div className="md:col-span-5 space-y-1">
              <div className="font-headline text-3xl sm:text-5xl font-bold text-brick tracking-tight">
                ₹43,20,000
              </div>
              <p className="text-xs text-ink-soft">
                Includes ₹2,16,000 contingency (5%) indicative, not a quotation.
              </p>
            </div>

            <div className="md:col-span-4 space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                PLANNING RATE
              </div>
              <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
                ₹2,400 <span className="text-xs font-sans font-normal text-ink-soft">/ sq ft</span>
              </div>
              <p className="text-xs text-forest font-semibold">
                Planning range: ₹38,88,000 – ₹47,52,000
              </p>
            </div>

            <div className="md:col-span-3 space-y-1 font-mono text-xs text-ink-soft">
              <div>Total built-up: <strong className="text-ink">1,800 sq ft</strong></div>
              <div>Floors: <strong className="text-ink">G+1</strong></div>
              <div>Plot: <strong className="text-ink">1,200 sq ft</strong></div>
            </div>
          </div>
        </div>

        {/* Main Grid: Breakdown & Revisions on left, Schematic & Materials on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* The saved cost breakdown */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-ink/14 pb-2">
                <h2 className="font-headline text-xl font-bold text-ink">
                  The saved cost breakdown
                </h2>
                <span className="text-xs font-mono text-ink-soft">
                  9 categories · 100% allocated
                </span>
              </div>

              <div className="border border-ink/14 rounded-lg overflow-hidden bg-paper shadow-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper-deep/70 text-ink-soft font-mono uppercase text-[10px] tracking-wider border-b border-ink/14">
                    <tr>
                      <th scope="col" className="py-2.5 px-4 font-semibold">Cost Category</th>
                      <th scope="col" className="py-2.5 px-4 text-center font-semibold">Share</th>
                      <th scope="col" className="py-2.5 px-4 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10 font-sans">
                    <tr>
                      <td className="py-2 px-4 font-medium">Site preparation & foundation</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">12%</td>
                      <td className="py-2 px-4 text-right font-mono">₹5,18,400</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">RCC structure</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">31%</td>
                      <td className="py-2 px-4 text-right font-mono">₹13,39,200</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Masonry & plaster</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">18%</td>
                      <td className="py-2 px-4 text-right font-mono">₹7,77,600</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Flooring & wall tiles</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">10%</td>
                      <td className="py-2 px-4 text-right font-mono">₹4,32,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Doors & windows</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">10%</td>
                      <td className="py-2 px-4 text-right font-mono">₹4,32,000</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Electrical works</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">7%</td>
                      <td className="py-2 px-4 text-right font-mono">₹3,02,400</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Plumbing & sanitary</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">7%</td>
                      <td className="py-2 px-4 text-right font-mono">₹3,02,400</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Painting & finishes</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">7%</td>
                      <td className="py-2 px-4 text-right font-mono">₹3,02,400</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 font-medium">Contingency allowance</td>
                      <td className="py-2 px-4 text-center font-mono text-ink-soft">5%</td>
                      <td className="py-2 px-4 text-right font-mono">₹2,16,000</td>
                    </tr>
                    <tr className="bg-clay/40 font-bold border-t-2 border-ink/20">
                      <td className="py-2.5 px-4 text-ink font-sans text-sm">Total indicative estimate</td>
                      <td className="py-2.5 px-4 text-center font-mono">100%</td>
                      <td className="py-2.5 px-4 text-right font-mono text-brick text-sm">₹43,20,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-ink-soft leading-relaxed">
                Based on planning assumptions v1.0, 07 Oct 2026. Material and labour allowances are included; live market rates are not verified.
              </p>
            </div>

            {/* How the plan has changed (Revision History) */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-ink/14 pb-2">
                <h2 className="font-headline text-xl font-bold text-ink">
                  How the plan has changed
                </h2>
                <span className="text-xs font-mono text-ink-soft">
                  2 saved versions
                </span>
              </div>

              <div className="space-y-3 font-sans">
                {/* Revision 1 */}
                <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink">Revision 1 · Standard</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-forest text-paper font-semibold">
                          CURRENT
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-ink-soft">07 Oct 2026 · 11:42</div>
                    </div>
                    <div className="font-headline text-xl font-bold text-ink">
                      ₹43,20,000
                    </div>
                  </div>
                  <p className="text-xs text-ink-soft">
                    Quality updated from Economy to Standard. Area unchanged at 1,800 sq ft.
                  </p>
                </div>

                {/* Revision 0 */}
                <div className="bg-paper-deep/30 border border-ink/14 rounded-lg p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink">Revision 0 · Economy</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-clay text-ink-soft">
                          EARLIER VERSION
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-ink-soft">28 Sep 2026 · 18:10</div>
                    </div>
                    <div className="font-headline text-xl font-bold text-ink-soft">
                      ₹36,00,000
                    </div>
                  </div>
                  <p className="text-xs text-ink-soft">
                    Initial planning estimate · 1,800 sq ft × ₹2,000 / sq ft.
                  </p>
                </div>

                <div className="text-[11px] font-mono text-ink-soft pt-1">
                  Change: +₹7,20,000 (+20%) from the initial estimate. Each version includes a 5% contingency.
                </div>
              </div>

              {/* Revision Notice Callout */}
              <div className="bg-clay/40 border border-ink/14 rounded-lg p-3.5 flex gap-2.5 items-start text-xs text-ink-soft">
                <Info className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-ink">This record stays with your project:</strong> Revising creates a new version. Your earlier estimate and choices remain in the revision history for comparison.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Schematic, Material choices, Scope */}
          <div className="lg:col-span-4 space-y-5">
            {/* Schematic */}
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
              <HouseSchematic
                groundArea="900 sq ft"
                firstFloorArea="900 sq ft"
                totalArea="1,800 sq ft"
              />
              <p className="text-[11px] text-ink-soft leading-relaxed pt-2 border-t border-ink/10">
                Two floors of approximately 900 sq ft each. Area and setbacks to be confirmed with your architect.
              </p>
            </div>

            {/* Material choices */}
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3 font-sans">
              <div className="flex justify-between items-center">
                <h3 className="font-headline text-base font-bold text-ink">
                  Your material choices
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-clay text-ink-soft border border-ink/14 font-semibold">
                  STANDARD QUALITY
                </span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-ink/10">
                <div className="pt-1.5 flex justify-between">
                  <span className="text-ink-soft">Structure</span>
                  <span className="font-medium text-ink">RCC framed structure</span>
                </div>
                <div className="pt-1.5 flex justify-between">
                  <span className="text-ink-soft">Walling</span>
                  <span className="font-medium text-ink">AAC blocks</span>
                </div>
                <div className="pt-1.5 flex justify-between">
                  <span className="text-ink-soft">Flooring</span>
                  <span className="font-medium text-ink">Standard vitrified tiles</span>
                </div>
                <div className="pt-1.5 flex justify-between">
                  <span className="text-ink-soft">Doors & windows</span>
                  <span className="font-medium text-ink">Flush doors · uPVC windows</span>
                </div>
                <div className="pt-1.5 flex justify-between">
                  <span className="text-ink-soft">Electrical</span>
                  <span className="font-medium text-ink">Copper wiring · modular</span>
                </div>
                <div className="pt-1.5 flex justify-between">
                  <span className="text-ink-soft">Plumbing</span>
                  <span className="font-medium text-ink">CPVC / uPVC · standard</span>
                </div>
                <div className="pt-1.5 flex justify-between">
                  <span className="text-ink-soft">Paint</span>
                  <span className="font-medium text-ink">Washable interior emulsion</span>
                </div>
              </div>

              <Link
                to="/materials"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brick hover:underline pt-2 border-t border-ink/10 w-full"
              >
                <span>Review material tradeoffs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Scope stays important */}
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-2 text-xs text-ink-soft leading-relaxed font-sans">
              <h3 className="font-headline text-base font-bold text-ink">
                Scope stays important
              </h3>
              <p>
                Assumes normal foundations, regular site access and no basement. Structural design and material specifications need professional review.
              </p>
              <p className="border-t border-ink/10 pt-2 text-[11px]">
                Excluded: land, approvals and statutory fees, professional fees, external works, major utility connections, furniture, modular kitchen, lift and solar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

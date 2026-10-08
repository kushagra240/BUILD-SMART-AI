import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Download, ArrowRight, CheckCircle2, Bookmark, FileText } from 'lucide-react';
import { EstimateResponse } from '../types/estimate';
import { calculateEstimateMock } from '../services/mockApi';
import { formatINR, formatNumber } from '../lib/formatters';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

// Exact chart colors mapped to 9 cost categories
const CATEGORY_CHART_COLORS: Record<string, string> = {
  'Site preparation & foundation': '#6B4F3A',
  'Foundation': '#6B4F3A',
  'RCC structure': '#1F4D45',
  'Structure': '#1F4D45',
  'Masonry & plaster': '#B4472B',
  'Masonry': '#B4472B',
  'Flooring & wall tiles': '#D9A441',
  'Flooring': '#D9A441',
  'Doors & windows': '#8A6FA0',
  'Roofing & Openings': '#8A6FA0',
  'Roofing': '#8A6FA0',
  'Electrical works': '#9BB05A',
  'Electrical': '#9BB05A',
  'Plumbing & sanitary': '#4F86A6',
  'Plumbing': '#4F86A6',
  'Painting & finishes': '#D88C9A',
  'Finishing': '#D88C9A',
  'Contingency allowance': '#3A3F3C',
  'Labour & Contingency': '#3A3F3C',
};

function getCategoryColor(name: string): string {
  return CATEGORY_CHART_COLORS[name] || '#1F4D45';
}

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<EstimateResponse | null>(location.state?.estimate || null);
  const [loading, setLoading] = useState<boolean>(!location.state?.estimate);
  const [projectSaved, setProjectSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!estimate) {
      calculateEstimateMock({
        built_up_area_sqft: 1800,
        floors: 2,
        bedrooms: 3,
        bathrooms: 3,
        zone_id: 'pune_west',
        quality_tier: 'standard',
        construction_type: 'rcc_framed',
        plot_area_sqft: 1200,
      }).then((res) => {
        setEstimate(res);
        setLoading(false);
      });
    }
  }, [estimate]);

  if (loading || !estimate) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 bg-paper text-ink">
        <div className="w-10 h-10 border-2 border-brick border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-ink-soft">Preparing illustrative Pune estimate...</p>
      </div>
    );
  }

  const projectName = location.state?.projectName || 'Deshmukh residence';
  const locality = location.state?.locality || 'Baner, Pune';
  const totalCost = estimate.total_inr.p50;
  const areaSqFt = estimate.inputs.built_up_area_sqft;
  const ratePerSqFt = Math.round(totalCost / areaSqFt);
  const contingencyAmount = Math.round(totalCost * 0.05);

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Step Indicator Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-forest text-paper font-semibold">1</span>
            <span className="text-ink">Project & site</span>
            <span className="text-ink-soft">›</span>
            <span className="px-2 py-0.5 rounded bg-forest text-paper font-semibold">2</span>
            <span className="text-ink">Preferences</span>
            <span className="text-ink-soft">›</span>
            <span className="px-2 py-0.5 rounded bg-brick text-paper font-semibold">3</span>
            <span className="font-semibold text-ink">Your estimate</span>
          </div>

          <div className="flex items-center gap-2">
            <SampleDataBadge text="Sample data" />
            <Link
              to="/pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
            >
              <Download className="w-3.5 h-3.5 text-ink-soft" />
              <span>Download PDF</span>
            </Link>
            <button
              type="button"
              onClick={() => setProjectSaved(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brick hover:bg-brick-hover text-xs font-medium text-paper shadow-subtle transition-colors focus-ring"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{projectSaved ? 'Saved' : 'Save project'}</span>
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-soft">
            {projectName.toUpperCase()} · ESTIMATE BS-2026-004
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            Your home, in numbers.
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft font-sans">
            {locality} · G+1 · {formatNumber(areaSqFt)} sq ft total built-up · Standard quality
          </p>
        </div>

        {/* Top KPI Box (Screenshot 2 right side) */}
        <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Indicative Total */}
          <div className="md:col-span-5 space-y-1.5 md:border-r border-ink/10 md:pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-clay text-ink-soft border border-ink/14 font-semibold">
                INDICATIVE · NOT A QUOTE
              </span>
              <SampleDataBadge text="Sample data" variant="subtle" />
            </div>
            <div className="font-headline text-3xl sm:text-5xl font-bold text-brick tracking-tight">
              {formatINR(totalCost)}
            </div>
            <p className="text-xs text-ink-soft font-sans">
              Includes {formatINR(contingencyAmount)} contingency allowance (5%)
            </p>
          </div>

          {/* Planning Rate & Band */}
          <div className="md:col-span-4 space-y-1 md:border-r border-ink/10 md:pr-6">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              PLANNING RATE
            </div>
            <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
              ₹{formatNumber(ratePerSqFt)} <span className="text-sm font-sans font-normal text-ink-soft">/ sq ft</span>
            </div>
            <div className="text-xs text-forest font-semibold pt-0.5">
              Planning range: {formatINR(estimate.total_inr.p10)} – {formatINR(estimate.total_inr.p90)}
            </div>
            <p className="text-[11px] text-ink-soft leading-tight">
              ±10% around median. A planning band, not a guaranteed price range.
            </p>
          </div>

          {/* Built-up Area */}
          <div className="md:col-span-3 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              TOTAL BUILT-UP AREA
            </div>
            <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
              {formatNumber(areaSqFt)} <span className="text-sm font-sans font-normal text-ink-soft">sq ft</span>
            </div>
            <p className="text-[11px] text-ink-soft leading-tight">
              Across ground and first floor. Plot size not included in construction rate.
            </p>
          </div>
        </div>

        {/* Main Grid: Breakdown on left, Assumptions on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Where the budget goes */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-baseline justify-between border-b border-ink/14 pb-2">
              <h2 className="font-headline text-xl font-bold text-ink">
                Where the budget goes
              </h2>
              <span className="text-xs font-mono text-ink-soft">
                9 categories · 100% allocated
              </span>
            </div>

            {/* Segmented Stacked Bar Chart */}
            <div className="space-y-1.5">
              <div
                className="w-full h-5 rounded overflow-hidden flex border border-ink/14 shadow-inner"
                role="img"
                aria-label="Cost allocation chart across 9 categories"
              >
                {estimate.breakdown.map((item) => (
                  <div
                    key={item.category}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: getCategoryColor(item.category),
                    }}
                    title={`${item.category}: ${item.percentage}% (${formatINR(item.amount_inr)})`}
                    className="h-full transition-opacity hover:opacity-90"
                  />
                ))}
              </div>

              {/* Chart Legend Mini-bar */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-ink-soft pt-1">
                {estimate.breakdown.slice(0, 5).map((item) => (
                  <div key={item.category} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    />
                    <span>{item.category.split(' ')[0]} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 9 Categories Table */}
            <div className="border border-ink/14 rounded-lg overflow-hidden bg-paper">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-deep/70 text-ink-soft font-mono uppercase text-[10px] tracking-wider border-b border-ink/14">
                  <tr>
                    <th scope="col" className="py-2.5 px-4 font-semibold">Cost Category</th>
                    <th scope="col" className="py-2.5 px-4 text-center font-semibold">Share</th>
                    <th scope="col" className="py-2.5 px-4 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 font-sans">
                  {estimate.breakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-paper-deep/30 transition-colors">
                      <td className="py-2.5 px-4 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(cat.category) }}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-ink">{cat.category}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-ink-soft">
                        {cat.percentage}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-ink">
                        {formatINR(cat.amount_inr)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Highlight Row */}
                  <tr className="bg-clay/40 font-bold border-t-2 border-ink/20">
                    <td className="py-3 px-4 text-ink font-sans text-sm">
                      Total indicative estimate
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-ink">
                      100%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-brick text-sm">
                      {formatINR(totalCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-ink-soft leading-relaxed font-sans">
              All figures are illustrative planning allocations. Category amounts include materials and labour allowances; not itemised contractor rates.
            </p>

            {/* Make the materials work banner */}
            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="font-headline font-bold text-base text-ink">
                  Make the materials work for your home.
                </h3>
                <p className="text-xs text-ink-soft">
                  Compare sensible options before discussing specifications with your architect.
                </p>
              </div>
              <Link
                to="/materials"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink whitespace-nowrap focus-ring"
              >
                <span>View material recommendations</span>
                <ArrowRight className="w-3.5 h-3.5 text-brick" />
              </Link>
            </div>

            {/* Save state notification */}
            {projectSaved && (
              <div
                role="status"
                className="bg-paper-deep border border-forest/30 rounded-lg p-3 text-xs flex items-center gap-2 text-forest"
              >
                <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                <span>
                  <strong>SAVE STATE / Project saved:</strong> {projectName} is now in Saved projects. Estimate BS-2026-004 · Revision 1 · Saved 07 Oct 2026.
                </span>
              </div>
            )}
          </div>

          {/* Right Column: What we assumed & Not included */}
          <div className="lg:col-span-4 space-y-5">
            {/* What we assumed */}
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
              <h3 className="font-headline font-bold text-base text-ink">
                What we assumed
              </h3>
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between border-b border-ink/10 pb-1.5">
                  <span className="text-ink-soft">Structural</span>
                  <span className="font-medium text-ink">RCC frame</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1.5">
                  <span className="text-ink-soft">Walling</span>
                  <span className="font-medium text-ink">AAC blocks</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1.5">
                  <span className="text-ink-soft">Floors</span>
                  <span className="font-medium text-ink">Vitrified tiles</span>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-1.5">
                  <span className="text-ink-soft">Windows</span>
                  <span className="font-medium text-ink">uPVC</span>
                </div>
              </div>
              <p className="text-[11px] text-ink-soft leading-relaxed pt-1">
                Regular site access, normal foundations, no basement and standard service points. Written understanding is assumed before civil finishes.
              </p>
              <div className="pt-2 border-t border-ink/10 text-[10px] font-mono text-ink-soft">
                Prepared 07 Oct 2026 · Planning assumptions v1.0. No site visit or contractor verification.
              </div>
            </div>

            {/* Not included */}
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-2.5">
              <h3 className="font-headline font-bold text-base text-ink">
                Not included
              </h3>
              <ul className="text-xs text-ink-soft space-y-2 list-disc list-inside font-sans">
                <li>Land cost, approvals and statutory fees; architect, engineer and professional fees.</li>
                <li>Compound wall, landscaping and other external site works.</li>
                <li>Furniture, modular kitchen, lift, solar systems and major utility connections are also excluded.</li>
              </ul>
            </div>

            {/* Contingency Callout */}
            <div className="bg-clay/50 border border-ink/14 rounded-lg p-4 space-y-1.5 text-xs">
              <div className="font-semibold text-ink font-sans">
                Keep a contingency before you commit.
              </div>
              <p className="text-ink-soft leading-relaxed">
                The 5% reserve is included, not added on top. Review its adequacy after soil tests, structural drawings and contractor quotations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

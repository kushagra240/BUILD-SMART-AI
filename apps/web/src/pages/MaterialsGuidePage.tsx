import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Info, ShieldAlert } from 'lucide-react';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

export function MaterialsGuidePage() {
  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Header and Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                MATERIAL NOTEBOOK / DESHMUKH RESIDENCE
              </span>
              <SampleDataBadge text="Sample data" />
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              Choose for the way you&apos;ll live.
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              Practical material recommendations for your Standard-quality home in Baner, Pune.
            </p>
          </div>

          <Link
            to="/app/estimates/BS-2026-004"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors whitespace-nowrap focus-ring"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-ink-soft" />
            <span>Back to estimate</span>
          </Link>
        </div>

        {/* Intro Section: Spend on what you won't want to replace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4 font-sans">
            <h2 className="font-headline text-2xl font-bold text-ink">
              Spend on the things you won&apos;t want to replace.
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              Structure, concealed services and waterproofing deserve care at every budget. Let tiles, hardware and decorative finishes flex with your priorities.
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-forest text-paper font-semibold">
                STANDARD SELECTED
              </span>
              <span className="px-2.5 py-1 rounded bg-clay border border-ink/14 text-ink">
                G+1 · 1,800 SQ FT
              </span>
              <span className="px-2.5 py-1 rounded bg-paper-deep border border-ink/14 text-brick font-bold">
                ₹43,20,000 PLANNING TOTAL
              </span>
            </div>

            {/* Pune Monsoon Callout */}
            <div className="bg-clay/50 border border-ink/14 rounded-lg p-4 space-y-1 text-xs">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <Info className="w-4 h-4 text-forest" />
                <span>For Pune&apos;s monsoon and summer:</span>
              </div>
              <p className="text-ink-soft leading-relaxed">
                Ask for terrace slopes, drainage and wet-area waterproofing details. Compare shaded windows and cross-ventilation before paying for decorative upgrades.
              </p>
            </div>
          </div>

          {/* Right Materials Moodboard Vignette */}
          <div className="lg:col-span-4 bg-paper-deep/60 border border-ink/14 rounded-lg p-4 space-y-2">
            <div className="w-full h-44 rounded bg-clay/60 border border-ink/14 p-3 flex flex-col justify-between">
              {/* Material palette graphic */}
              <div className="grid grid-cols-3 gap-2 h-full">
                <div className="bg-paper border border-ink/14 rounded p-2 flex flex-col justify-end text-[10px] font-mono text-ink">
                  <span>Wood / Teak</span>
                </div>
                <div className="bg-brick/20 border border-brick/40 rounded p-2 flex flex-col justify-end text-[10px] font-mono text-brick">
                  <span>Clay / Brick</span>
                </div>
                <div className="bg-forest/15 border border-forest/30 rounded p-2 flex flex-col justify-end text-[10px] font-mono text-forest">
                  <span>uPVC / Glass</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-ink-soft text-center italic">
              Material study · Illustrative samples, not product specifications
            </p>
          </div>
        </div>

        {/* Three approaches, one sound foundation comparison table */}
        <div className="space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-ink/14 pb-2">
            <h2 className="font-headline text-xl font-bold text-ink">
              Three approaches, one sound foundation
            </h2>
            <span className="text-xs font-mono text-ink-soft">
              Planning assumptions · not supplier availability
            </span>
          </div>

          <div className="border border-ink/14 rounded-lg overflow-hidden bg-paper shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-deep/70 text-ink-soft font-mono uppercase text-[10px] tracking-wider border-b border-ink/14">
                  <tr>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4">Material / System</th>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4">
                      <div>Economy</div>
                      <div className="text-[10px] lowercase font-normal text-ink-soft">₹2,000/sq ft · ₹36L</div>
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4 bg-clay/50 text-ink border-l border-r border-ink/14">
                      <div className="flex items-center gap-1.5">
                        <span>Standard</span>
                        <span className="px-1.5 py-0.2 rounded bg-forest text-paper text-[9px]">SELECTED</span>
                      </div>
                      <div className="text-[10px] lowercase font-normal text-ink-soft">₹2,400/sq ft · ₹43.2L</div>
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4">
                      <div>Premium</div>
                      <div className="text-[10px] lowercase font-normal text-ink-soft">₹3,100/sq ft · ₹55.8L</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 font-sans">
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Structure</td>
                    <td className="py-3 px-4 text-ink-soft">Engineered RCC; approved steel</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">Engineered RCC; approved steel</td>
                    <td className="py-3 px-4 text-ink-soft">Engineered RCC; approved steel</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Walling</td>
                    <td className="py-3 px-4 text-ink-soft">Fly-ash bricks</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">AAC blocks</td>
                    <td className="py-3 px-4 text-ink-soft">AAC blocks with upgraded detailing</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Flooring</td>
                    <td className="py-3 px-4 text-ink-soft">Basic ceramic / vitrified</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">Standard vitrified</td>
                    <td className="py-3 px-4 text-ink-soft">Large-format vitrified / stone</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Doors</td>
                    <td className="py-3 px-4 text-ink-soft">Flush doors, basic hardware</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">Flush doors, durable hardware</td>
                    <td className="py-3 px-4 text-ink-soft">Veneered doors, upgraded hardware</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Windows</td>
                    <td className="py-3 px-4 text-ink-soft">Aluminium, basic glazing</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">uPVC, standard glazing</td>
                    <td className="py-3 px-4 text-ink-soft">Higher-spec fixative and glazing</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Electrical</td>
                    <td className="py-3 px-4 text-ink-soft">Copper wiring, basic switches</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">Copper wiring, modular switches</td>
                    <td className="py-3 px-4 text-ink-soft">Copper wiring, embossed plates</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Plumbing</td>
                    <td className="py-3 px-4 text-ink-soft">CPVC / uPVC, basic fixtures</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">CPVC / uPVC, standard fixtures</td>
                    <td className="py-3 px-4 text-ink-soft">CPVC / uPVC, premium fixtures</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Paint</td>
                    <td className="py-3 px-4 text-ink-soft">Basic interior emulsion</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">Washable interior emulsion</td>
                    <td className="py-3 px-4 text-ink-soft">Higher-spec washable finishes</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-ink">Waterproofing</td>
                    <td className="py-3 px-4 text-ink-soft">Specified wet-area system</td>
                    <td className="py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14">Specified wet-area + roof detailing</td>
                    <td className="py-3 px-4 text-ink-soft">Specified system + embossed detailing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-ink-soft leading-relaxed">
            Each scenario includes a 5% contingency and the same emissions. Higher quality means finish and specification allowances—not a license to compromise structural safety at a lower budget.
          </p>
        </div>

        {/* 3 Review Cards (AAC block, Vitrified, Details before brands) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
          <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-base font-bold text-ink">AAC block walling</h3>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-clay text-ink-soft font-semibold">
                REVIEW
              </span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Lower weight than conventional brick and useful thermal performance. Needs appropriate mortar, joint treatment and experienced workmanship.
            </p>
            <p className="text-[11px] text-ink-soft border-t border-ink/10 pt-2">
              Ask your engineer about wall thickness, fixings and lintel-pocket detailing. Compare delivered and cost/piece locally.
            </p>
          </div>

          <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 space-y-2.5">
            <h3 className="font-headline text-base font-bold text-ink">Vitrified, not oversized</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              Standard size vitrified tiles balance upkeep and cost. Large formats can add wastage and need flatter substrates and skilled installation.
            </p>
            <p className="text-[11px] text-ink-soft border-t border-ink/10 pt-2">
              Choose slip-resistant surfaces for bathrooms and balconies. Review samples in daylight before selecting.
            </p>
          </div>

          <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 space-y-2.5">
            <h3 className="font-headline text-base font-bold text-ink">Details before brands</h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              uPVC can be a low-maintenance window option. Frame quality, reinforcement, seals and installation matter as much as the material.
            </p>
            <p className="text-[11px] text-ink-soft border-t border-ink/10 pt-2">
              Check drainage paths, shading and ventilation. Gather written specifications and warranties with your vendor.
            </p>
          </div>
        </div>

        {/* Disclaimer Callout Box */}
        <div className="bg-clay/50 border border-ink/14 rounded-lg p-4 text-xs text-ink-soft leading-relaxed">
          <strong className="text-ink font-sans">
            A recommendation is not a purchase specification:
          </strong>{' '}
          No supplier stock or availability is claimed. Obtain local quotations, verify codes, certifications, installation details and suitability with your architect or engineer before ordering.
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle2, FileText } from 'lucide-react';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

export function PdfPreviewPage() {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    setDownloaded(true);
    window.print();
  };

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                REPORT / DESHMUKH RESIDENCE
              </span>
              <SampleDataBadge text="Sample data" />
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              A considered budget, ready to keep.
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              Review the complete two-page report before downloading or sharing with your architect.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* 2 Columns: A4 Sheets on left, Report metadata on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Two Rendered Document Sheets */}
          <div className="lg:col-span-8 space-y-6">
            {/* Sheet 1 */}
            <div className="bg-white border border-ink/14 rounded-sm p-6 sm:p-10 shadow-card text-ink space-y-6 font-sans">
              <div className="flex justify-between items-center border-b border-ink/10 pb-4 text-xs font-mono text-ink-soft">
                <span className="font-bold text-ink">BuildSmart AI</span>
                <span>BS-2026-004 · 07 OCT 2026</span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-ink-soft">01 / PROJECT & BUDGET</div>
                <h2 className="font-headline text-2xl font-bold text-ink">
                  Deshmukh residence
                </h2>
                <p className="text-xs text-ink-soft">A starting point for your building budget.</p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-paper-deep/30 p-3 rounded border border-ink/10 font-sans">
                <div><span className="text-ink-soft">Location:</span> <strong>Baner, Pune</strong></div>
                <div><span className="text-ink-soft">Total built-up:</span> <strong>1,800 sq ft</strong></div>
                <div><span className="text-ink-soft">Configuration:</span> <strong>G+1 · 2 floors</strong></div>
                <div><span className="text-ink-soft">Plot area:</span> <strong>1,200 sq ft</strong></div>
                <div><span className="text-ink-soft">Prepared for:</span> <strong>Aniket Deshmukh</strong></div>
                <div><span className="text-ink-soft">Quality tier:</span> <strong>Standard</strong></div>
              </div>

              {/* Box Total */}
              <div className="border border-ink/14 bg-paper/60 p-4 rounded space-y-1">
                <div className="text-[10px] font-mono uppercase text-ink-soft">INDICATIVE CONSTRUCTION ESTIMATE</div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-headline text-3xl font-bold text-brick">₹43,20,000</span>
                  <span className="font-headline text-lg font-bold text-ink">₹2,400 / sq ft</span>
                </div>
                <p className="text-[11px] text-ink-soft">
                  1,800 sq ft × ₹2,400 / sq ft · Includes 5% contingency · Planning range: ₹38,88,000 – ₹47,52,000 (±10%)
                </p>
              </div>

              {/* Nine-Category Table */}
              <div className="space-y-2">
                <div className="font-headline font-bold text-sm text-ink">Nine-category cost breakdown</div>
                <div className="border border-ink/10 rounded overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-paper-deep/70 p-2 font-mono text-[10px] text-ink-soft border-b border-ink/10">
                    <span className="col-span-8">COST CATEGORY</span>
                    <span className="col-span-2 text-center">SHARE</span>
                    <span className="col-span-2 text-right">AMOUNT</span>
                  </div>
                  <div className="divide-y divide-ink/10 text-xs p-1">
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Site preparation & foundation</span>
                      <span className="col-span-2 text-center font-mono">12%</span>
                      <span className="col-span-2 text-right font-mono">₹5,18,400</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">RCC structure</span>
                      <span className="col-span-2 text-center font-mono">31%</span>
                      <span className="col-span-2 text-right font-mono">₹13,39,200</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Masonry & plaster</span>
                      <span className="col-span-2 text-center font-mono">18%</span>
                      <span className="col-span-2 text-right font-mono">₹7,77,600</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Flooring & wall tiles</span>
                      <span className="col-span-2 text-center font-mono">10%</span>
                      <span className="col-span-2 text-right font-mono">₹4,32,000</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Doors & windows</span>
                      <span className="col-span-2 text-center font-mono">10%</span>
                      <span className="col-span-2 text-right font-mono">₹4,32,000</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Electrical works</span>
                      <span className="col-span-2 text-center font-mono">7%</span>
                      <span className="col-span-2 text-right font-mono">₹3,02,400</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Plumbing & sanitary</span>
                      <span className="col-span-2 text-center font-mono">7%</span>
                      <span className="col-span-2 text-right font-mono">₹3,02,400</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Painting & finishes</span>
                      <span className="col-span-2 text-center font-mono">7%</span>
                      <span className="col-span-2 text-right font-mono">₹3,02,400</span>
                    </div>
                    <div className="grid grid-cols-12 py-1 px-2">
                      <span className="col-span-8">Contingency allowance</span>
                      <span className="col-span-2 text-center font-mono">5%</span>
                      <span className="col-span-2 text-right font-mono">₹2,16,000</span>
                    </div>
                    <div className="grid grid-cols-12 py-1.5 px-2 bg-clay/30 font-bold border-t border-ink/14">
                      <span className="col-span-8">Total indicative estimate</span>
                      <span className="col-span-2 text-center font-mono">100%</span>
                      <span className="col-span-2 text-right font-mono text-brick">₹43,20,000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-ink-soft border-t border-ink/10 pt-4">
                <span>BUILD SMART AI · PRELIMINARY ESTIMATE · NOT A CONTRACTOR QUOTATION</span>
                <span>Page 1 / 2</span>
              </div>
            </div>

            {/* Sheet 2 */}
            <div className="bg-white border border-ink/14 rounded-sm p-6 sm:p-10 shadow-card text-ink space-y-5 font-sans">
              <div className="flex justify-between items-center border-b border-ink/10 pb-4 text-xs font-mono text-ink-soft">
                <span className="font-bold text-ink">BuildSmart AI</span>
                <span>BS-2026-004 · 07 OCT 2026</span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-ink-soft">02 / MATERIALS & SCOPE</div>
                <h2 className="font-headline text-2xl font-bold text-ink">
                  The assumptions behind the number.
                </h2>
                <p className="text-xs text-ink-soft">
                  Read alongside your site assessment and final construction drawings.
                </p>
              </div>

              {/* Recommended material approach */}
              <div className="space-y-2">
                <div className="font-headline font-bold text-sm text-ink">Recommended material approach</div>
                <div className="border border-ink/10 rounded divide-y divide-ink/10 text-xs">
                  <div className="p-2 grid grid-cols-4">
                    <span className="font-medium text-ink-soft">Structure</span>
                    <span className="col-span-3">Engineered RCC frame; approved concrete and reinforcement grades.</span>
                  </div>
                  <div className="p-2 grid grid-cols-4">
                    <span className="font-medium text-ink-soft">Walling</span>
                    <span className="col-span-3">AAC blocks with appropriate mortar, fixings and joint treatment.</span>
                  </div>
                  <div className="p-2 grid grid-cols-4">
                    <span className="font-medium text-ink-soft">Floors & openings</span>
                    <span className="col-span-3">Standard vitrified tiles; flush doors; uPVC windows and standard glazing.</span>
                  </div>
                  <div className="p-2 grid grid-cols-4">
                    <span className="font-medium text-ink-soft">Services</span>
                    <span className="col-span-3">Copper wiring, modular switches; CPVC / uPVC pipes and standard sanitary fixtures.</span>
                  </div>
                  <div className="p-2 grid grid-cols-4">
                    <span className="font-medium text-ink-soft">Paint & waterproofing</span>
                    <span className="col-span-3">Washable interior emulsion; specified wet-end wet-area waterproofing.</span>
                  </div>
                </div>
              </div>

              {/* Scope Inclusions & Exclusions */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <strong className="text-ink">Included & assumed:</strong> Regular site access, normal foundation conditions, no basement and a G+1 RCC frame. Includes civil structure, masonry and plaster, flooring, openings, standard electrical and plumbing works, painting and a 5% contingency.
                </div>
                <div>
                  <strong className="text-ink">Budget separately:</strong> Land purchase, approvals and statutory fees; architect, engineer and other professional fees; compound walls, landscaping and external services; major utility connections; furniture, modular kitchen, lift and solar systems.
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-paper-deep/60 border border-ink/10 p-3 rounded text-[11px] text-ink-soft leading-relaxed">
                <strong className="text-ink">PRELIMINARY ESTIMATE — NOT A QUOTATION:</strong> This report is purely preliminary budgeting help. It is not a bill of quantities, structural design or contractor offer. Actual costs will vary based on site conditions, drawings, vendor specifications, and market fluctuations.
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-ink-soft border-t border-ink/10 pt-4">
                <span>BUILD SMART AI · PRELIMINARY ESTIMATE · NOT A CONTRACTOR QUOTATION</span>
                <span>Page 2 / 2</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-forest text-paper font-semibold">
                  DOWNLOAD READY
                </span>
                <SampleDataBadge text="Sample data" variant="subtle" />
              </div>

              <div className="space-y-0.5">
                <h3 className="font-headline text-lg font-bold text-ink">
                  Deshmukh residence
                </h3>
                <div className="space-y-1.5 text-xs font-mono text-ink-soft border-t border-b border-ink/10 py-3">
                  <div className="flex justify-between">
                    <span>Report ID</span>
                    <span className="text-ink font-semibold">BS-2026-004</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revision</span>
                    <span className="text-ink">1 · Standard</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prepared</span>
                    <span className="text-ink">07 Oct 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format</span>
                    <span className="text-ink">PDF · A4 · 2 pages</span>
                  </div>
                </div>
              </div>

              <div className="bg-paper border border-ink/14 rounded p-2 text-xs font-mono text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-brick flex-shrink-0" />
                <span className="truncate">Deshmukh-residence-estimate.pdf</span>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <Link
                to="/app/projects/deshmukh-residence"
                className="block text-center text-xs text-ink-soft hover:text-ink pt-1"
              >
                Return to saved project
              </Link>
            </div>

            {/* Inside the report list */}
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-2 text-xs">
              <h4 className="font-headline font-bold text-sm text-ink">Inside the report</h4>
              <ul className="space-y-1.5 text-ink-soft">
                <li>01 · Project, size and planning budget</li>
                <li>Nine cost categories and contingency</li>
                <li>02 · Materials and scope assumptions</li>
                <li>Exclusions, next steps and disclaimer</li>
              </ul>
            </div>

            {/* Download state confirmation */}
            {downloaded && (
              <div
                role="status"
                className="bg-paper-deep border border-forest/30 rounded-lg p-3 text-xs flex items-center gap-2 text-forest"
              >
                <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0" />
                <span>
                  <strong>DOWNLOAD STATE:</strong> PDF downloaded. Your saved estimate remains intact.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

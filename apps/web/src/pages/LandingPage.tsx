import { Link } from 'react-router-dom';
import { Calculator, ShieldCheck, Layers, FileSpreadsheet, Sparkles, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-16 pb-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Phase 1 Frontend Prototype · Pune Region</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Intelligent Construction Cost Estimation for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Pune Homes</span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed">
              Enter your built-up area, floors, zone, and quality tier. Get a transparent total cost estimate with honest ranges, 9-category breakdown, material recommendations, and budget feasibility check.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                to="/app/new"
                className="px-6 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-amber-500/40"
              >
                <Calculator className="w-5 h-5" aria-hidden="true" />
                <span>Start 4-Step Estimate Wizard</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/methodology"
                className="px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>How Estimates Work</span>
              </Link>
            </div>

            {/* Quick highlights */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>9 Cost Categories</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Indian ₹ Formatting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>WCAG 2.1 AA Accessible</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works 4 Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Simple 4-Step Workflow</h2>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">How BuildSmart AI Estimates Your Project</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-base">1</div>
            <h3 className="text-lg font-bold text-slate-900">Project Basics</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Enter total built-up area (sq. ft), number of floors (1-4), bedrooms, and bathrooms.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-base">2</div>
            <h3 className="text-lg font-bold text-slate-900">Location & Quality</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Select Pune location zone (Central, East, West, PCMC, South) and quality tier (Economy, Standard, Premium).
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-base">3</div>
            <h3 className="text-lg font-bold text-slate-900">Target Budget</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Optionally enter your planned budget to receive feasibility feedback and gap analysis in ₹ INR.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-base">4</div>
            <h3 className="text-lg font-bold text-slate-900">Results & Breakdown</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Review P50 estimate, P10-P90 range, doughnut chart, 9-category breakdown, and material recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Engineered For Clarity</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Key Features & Deliverables</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">9-Category Breakdown</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Foundation, Structure, Masonry, Roofing, Flooring, Plumbing, Electrical, Finishing, and Site Labour breakdown.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Material Recommendations</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Deterministic rules for Cement (OPC/PPC), Steel (Fe500D), Masonry blocks, Tiles, and Paint specifications.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Accessible & PDF Ready</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Built with full WCAG 2.1 AA keyboard support, high-contrast tables, accessible charts, and PDF export skeleton.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Zones Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Location Coverage</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Pune & PCMC Cost Zone Calibration</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Supports Pune Central, East Pune (Kharadi/Hadapsar), West Pune (Baner/Wakad/Hinjewadi), PCMC, and South Peripheral zones.
            </p>
          </div>
          <Link
            to="/app/new"
            className="px-6 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <span>Create New Estimate</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

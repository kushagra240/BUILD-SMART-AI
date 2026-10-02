import { BookOpen, Layers, ShieldCheck, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MethodologyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
          <span>Documentation & Transparency</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Estimation Methodology & Data Strategy</h1>
        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
          Learn how BuildSmart AI models construction costs, splits 9-category allocations, and maintains complete data provenance.
        </p>
      </div>

      {/* Model Overview */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Estimation Engine Architecture</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          The prediction pipeline models <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-700 font-mono">log(total_cost_inr)</code> from primary architectural features: built-up area, floors, location zone multiplier, and quality tier. It outputs a headline median estimate (P50) alongside 80% empirical bounds (P10 to P90).
        </p>
      </section>

      {/* Data Composition */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Data Strategy & Provenance</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          In strict compliance with project non-negotiable principles, every dataset record carries provenance tags:
        </p>
        <ul className="list-disc list-inside text-sm text-slate-700 space-y-2 pl-2">
          <li>
            <strong className="text-slate-900 font-semibold">real_project:</strong> Actual completed Pune residential project records used as gold evaluation holdout.
          </li>
          <li>
            <strong className="text-slate-900 font-semibold">published_rate_derived:</strong> Rates derived from PMC Schedule of Rates (SoR) and verified municipal publications.
          </li>
          <li>
            <strong className="text-slate-900 font-semibold">synthetic:</strong> Controlled synthetic noise augmentation for range evaluation (clearly tagged).
          </li>
        </ul>
      </section>

      {/* 9 Categories */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">9 Cost Categories Allocation</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">1. Foundation (11%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">2. Structure (28%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">3. Masonry (11%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">4. Roofing (5%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">5. Flooring (10%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">6. Plumbing (7%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">7. Electrical (7%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">8. Finishing (10%)</div>
          <div className="p-3 bg-slate-50 border rounded-lg font-semibold">9. Labour (11%)</div>
        </div>
      </section>

      {/* Call to action */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between">
        <div className="text-xs text-slate-300">Ready to run a simulated cost calculation?</div>
        <Link
          to="/app/new"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
        >
          Open Estimate Wizard
        </Link>
      </div>
    </div>
  );
}

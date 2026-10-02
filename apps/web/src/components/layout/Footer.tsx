import { Link } from 'react-router-dom';
import { HardHat, Info } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-amber-500 text-slate-950 p-1.5 rounded">
                <HardHat className="w-4 h-4" aria-hidden="true" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">BuildSmart AI</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Intelligent Preliminary Construction Cost Estimator for residential projects in Pune and PCMC region.
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-300 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Model: v0.1.0-mock</span>
              <span className="text-slate-600">|</span>
              <span>Data: v2026.09-mock</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">
                  Home Landing
                </Link>
              </li>
              <li>
                <Link to="/app/new" className="hover:text-amber-400 transition-colors">
                  Estimate Wizard (MOCK)
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-amber-400 transition-colors">
                  Methodology & Data
                </Link>
              </li>
            </ul>
          </div>

          {/* Auth & Account */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-amber-400 transition-colors">
                  Register Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Academic & Disclaimer */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Academic Info</h3>
            <p className="text-slate-400 leading-relaxed mb-2">
              MIT School of Computing · MIT-ADT University, Pune
              <br />
              Group SY 112 · Sem 3 (A.Y. 2026-27)
              <br />
              Guide: Prof. Rinku Badgujar
            </p>
          </div>
        </div>

        {/* Disclaimer Callout */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 text-slate-300 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wide">Preliminary Disclaimer (Non-Negotiable)</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              BuildSmart AI provides preliminary estimates for budgeting and educational planning purposes only. Output numbers do not replace a structural engineer, quantity surveyor, or binding contractor quotation. All rates shown in Phase 1 frontend are placeholders labelled MOCK.
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-4 border-t border-slate-900 text-center sm:flex sm:justify-between text-slate-500">
          <p>© 2026 BuildSmart AI Team. MIT-ADT University Pune.</p>
          <p className="mt-2 sm:mt-0">Licensed under MIT Academic License.</p>
        </div>
      </div>
    </footer>
  );
}

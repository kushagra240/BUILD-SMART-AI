import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HardHat, Calculator, BookOpen, User, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { MockBanner } from './MockBanner';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Simple mock user state stored in memory
  const [mockUser] = useState<{ name: string; email: string } | null>(null);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-slate-100 shadow-md border-b border-slate-800">
      <MockBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md p-1">
            <div className="bg-amber-500 text-slate-950 p-2 rounded-lg group-hover:bg-amber-400 transition-colors">
              <HardHat className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                BuildSmart <span className="text-amber-500">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                Pune
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Home
            </Link>
            <Link
              to="/app/new"
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/app/new')
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Calculator className="w-4 h-4" aria-hidden="true" />
              <span>Estimate Wizard</span>
            </Link>
            <Link
              to="/methodology"
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/methodology')
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Methodology</span>
            </Link>
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {mockUser ? (
              <div className="flex items-center gap-2 bg-slate-800 text-slate-200 px-3 py-1.5 rounded-full text-xs border border-slate-700">
                <User className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>{mockUser.name} (Mock)</span>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Log in</span>
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle main menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <nav id="mobile-menu" className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Home
          </Link>
          <Link
            to="/app/new"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/app/new') ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400 hover:bg-slate-800'
            }`}
          >
            Estimate Wizard (MOCK)
          </Link>
          <Link
            to="/methodology"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/methodology') ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            Methodology
          </Link>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm font-medium text-slate-200 bg-slate-800 rounded-md"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm font-semibold text-slate-950 bg-amber-500 rounded-md"
            >
              Register
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

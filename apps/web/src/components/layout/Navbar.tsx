import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, Menu, X, ChevronDown } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();

  // Mock logged-in user profile shown in screenshots
  const [currentUser] = useState<{ initials: string; name: string } | null>({
    initials: 'AD',
    name: 'Aniket Deshmukh',
  });

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    if (path === '/app/new') {
      return location.pathname === '/app/new';
    }
    if (path === '/app/projects') {
      return location.pathname === '/app/projects' || location.pathname.startsWith('/app/projects/');
    }
    if (path === '/materials') {
      return location.pathname === '/materials';
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-ink/14 text-ink">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 border-b border-ink/10">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group rounded p-1 focus-ring"
            aria-label="BuildSmart AI home"
          >
            <div className="w-8 h-8 rounded-md bg-paper-deep border border-ink/14 flex items-center justify-center text-forest group-hover:border-forest transition-colors">
              <Home className="w-4 h-4 stroke-[2]" aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-headline font-bold text-lg tracking-tight text-ink">
                BuildSmart
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-clay text-ink-soft border border-ink/14">
                AI
              </span>
            </div>
          </Link>

          {/* Center Context Label (Figma Header) */}
          <div className="hidden md:flex items-center text-[10px] uppercase font-mono tracking-widest text-ink-soft">
            <span>HOUSE CONSTRUCTION / PUNE, INDIA</span>
          </div>

          {/* Right Action / User Profile */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-paper-deep text-xs font-medium text-ink border border-transparent hover:border-ink/14 transition-colors focus-ring"
                  aria-expanded={profileDropdownOpen}
                >
                  <span className="w-6 h-6 rounded-full bg-clay border border-ink/14 flex items-center justify-center text-[11px] font-mono font-semibold text-ink">
                    {currentUser.initials}
                  </span>
                  <span>{currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-soft" aria-hidden="true" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-paper border border-ink/14 rounded-lg shadow-subtle py-1 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-ink/10 text-ink-soft font-mono">
                      Signed in as Aniket
                    </div>
                    <Link
                      to="/app"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 hover:bg-paper-deep text-ink"
                    >
                      Project overview
                    </Link>
                    <Link
                      to="/app/projects"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 hover:bg-paper-deep text-ink"
                    >
                      Saved projects
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 hover:bg-paper-deep text-brick border-t border-ink/10"
                    >
                      Log out
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink rounded hover:bg-paper-deep"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-semibold text-paper bg-brick hover:bg-brick-hover rounded shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex sm:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded text-ink-soft hover:text-ink hover:bg-paper-deep focus-ring"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs Row (Figma Screenshot 1, 2, 3, 4) */}
        <div className="flex items-center justify-between text-xs overflow-x-auto scrollbar-none py-1">
          <nav className="flex items-center space-x-1 sm:space-x-6 whitespace-nowrap" aria-label="Sub navigation">
            <Link
              to="/app"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/app')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Overview
            </Link>
            <Link
              to="/app/new"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/app/new')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              New estimate
            </Link>
            <Link
              to="/app/projects"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/app/projects')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Saved projects
            </Link>
            <Link
              to="/materials"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/materials')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              Materials guide
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-soft whitespace-nowrap pl-4">
            <MapPin className="w-3.5 h-3.5 text-forest" aria-hidden="true" />
            <span>Planning for Pune</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav className="sm:hidden bg-paper-deep border-t border-ink/14 px-4 py-3 space-y-2 text-sm">
          <Link
            to="/app"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/app') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            Overview
          </Link>
          <Link
            to="/app/new"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/app/new') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            New estimate
          </Link>
          <Link
            to="/app/projects"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/app/projects') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            Saved projects
          </Link>
          <Link
            to="/materials"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/materials') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            Materials guide
          </Link>
          <Link
            to="/methodology"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/methodology') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            Methodology
          </Link>
          <div className="pt-2 border-t border-ink/10 flex justify-between gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 text-xs font-medium rounded border border-ink/14 bg-paper"
            >
              Log in
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 text-xs font-semibold rounded bg-brick text-paper"
            >
              Register
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MapPin, Menu, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/useAuth';
import { LanguageSwitcher } from './LanguageSwitcher';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '·';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, status, logout } = useAuth();
  const { t } = useTranslation();

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

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
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
            aria-label={t('nav.homeAria')}
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
            <span>{t('nav.context')}</span>
          </div>

          {/* Right Action / User Profile */}
          <div className="hidden sm:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-paper-deep text-xs font-medium text-ink border border-transparent hover:border-ink/14 transition-colors focus-ring"
                  aria-expanded={profileDropdownOpen}
                >
                  <span className="w-6 h-6 rounded-full bg-clay border border-ink/14 flex items-center justify-center text-[11px] font-mono font-semibold text-ink">
                    {initialsFor(user.full_name)}
                  </span>
                  <span>{user.full_name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-ink-soft" aria-hidden="true" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-paper border border-ink/14 rounded-lg shadow-subtle py-1 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-ink/10 text-ink-soft font-mono">
                      {t('nav.signedInAs', { name: user.full_name })}
                    </div>
                    <Link
                      to="/app"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 hover:bg-paper-deep text-ink"
                    >
                      {t('nav.projectOverview')}
                    </Link>
                    <Link
                      to="/app/projects"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-1.5 hover:bg-paper-deep text-ink"
                    >
                      {t('nav.savedProjects')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="block w-full text-left px-3 py-1.5 hover:bg-paper-deep text-brick border-t border-ink/10"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : status === 'loading' ? (
              <span className="text-xs text-ink-soft font-mono">{t('nav.checkingSession')}</span>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink rounded hover:bg-paper-deep"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-semibold text-paper bg-brick hover:bg-brick-hover rounded shadow-sm"
                >
                  {t('nav.register')}
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
              aria-label={t('nav.toggleMenu')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs Row (Figma Screenshot 1, 2, 3, 4) */}
        <div className="flex items-center justify-between text-xs overflow-x-auto scrollbar-none py-1">
          <nav
            className="flex items-center space-x-1 sm:space-x-6 whitespace-nowrap"
            aria-label={t('nav.subNavigation')}
          >
            <Link
              to="/app"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/app')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t('nav.overview')}
            </Link>
            <Link
              to="/app/new"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/app/new')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t('nav.newEstimate')}
            </Link>
            <Link
              to="/app/projects"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/app/projects')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t('nav.savedProjects')}
            </Link>
            <Link
              to="/materials"
              className={`py-2 px-2 text-xs font-medium border-b-2 transition-colors ${
                isActive('/materials')
                  ? 'border-brick text-ink font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t('nav.materialsGuide')}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-soft whitespace-nowrap pl-4">
            <MapPin className="w-3.5 h-3.5 text-forest" aria-hidden="true" />
            <span>{t('nav.planningForPune')}</span>
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
            {t('nav.overview')}
          </Link>
          <Link
            to="/app/new"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/app/new') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            {t('nav.newEstimate')}
          </Link>
          <Link
            to="/app/projects"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/app/projects') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            {t('nav.savedProjects')}
          </Link>
          <Link
            to="/materials"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/materials') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            {t('nav.materialsGuide')}
          </Link>
          <Link
            to="/methodology"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md ${
              isActive('/methodology') ? 'bg-clay text-ink font-semibold' : 'text-ink-soft'
            }`}
          >
            {t('nav.methodology')}
          </Link>
          <div className="pt-2 border-t border-ink/10">
            <LanguageSwitcher />
          </div>
          <div className="pt-2 border-t border-ink/10 flex justify-between gap-2">
            {user ? (
              <>
                <span className="flex-1 flex items-center px-2 text-xs text-ink-soft truncate">
                  {user.full_name}
                </span>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded border border-brick/40 text-brick bg-paper"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-medium rounded border border-ink/14 bg-paper"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded bg-brick text-paper"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

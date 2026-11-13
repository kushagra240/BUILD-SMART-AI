import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import buildSmartLogo from '../../assets/buildsmart-logo.png';
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

const NAV_LINK =
  'inline-flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold tracking-[0.02em] transition-colors duration-200 focus-ring';
const NAV_ACTIVE = 'bg-night text-white shadow-sm';
const NAV_IDLE = 'text-ink-soft hover:bg-paper-deep hover:text-ink';

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

  const primaryLinks = [
    { to: '/app', label: t('nav.overview') },
    { to: '/app/new', label: t('nav.newEstimate') },
    { to: '/app/projects', label: t('nav.savedProjects') },
    { to: '/materials', label: t('nav.materialsGuide') },
  ];

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto w-full max-w-shell rounded-xl border border-white/70 bg-panel/90 shadow-nav backdrop-blur-xl">
        {/* Main bar: brand, context, account actions */}
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg p-1 focus-ring"
            aria-label={t('nav.homeAria')}
          >
            <img
              src={buildSmartLogo}
              alt=""
              className="h-10 w-auto"
              width={117}
              height={40}
              decoding="async"
            />
          </Link>

          <div className="hidden justify-center md:flex">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              {t('nav.context')}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {user ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-line hover:bg-paper-deep focus-ring"
                  aria-expanded={profileDropdownOpen}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-night text-[11px] font-bold text-white">
                    {initialsFor(user.full_name)}
                  </span>
                  <span className="max-w-[10rem] truncate">{user.full_name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-ink-soft" aria-hidden="true" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-line bg-panel py-1.5 text-xs shadow-panel">
                    <div className="border-b border-line-soft px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                      {t('nav.signedInAs', { name: user.full_name })}
                    </div>
                    <Link
                      to="/app"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-2 font-medium text-ink transition-colors hover:bg-paper-deep"
                    >
                      {t('nav.projectOverview')}
                    </Link>
                    <Link
                      to="/app/projects"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-3 py-2 font-medium text-ink transition-colors hover:bg-paper-deep"
                    >
                      {t('nav.savedProjects')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="block w-full border-t border-line-soft px-3 py-2 text-left font-semibold text-error transition-colors hover:bg-error/5"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : status === 'loading' ? (
              <span className="hidden text-[11px] font-medium text-ink-soft sm:block">
                {t('nav.checkingSession')}
              </span>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-ink focus-ring"
                >
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary h-10 px-4">
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="grid h-10 w-10 place-items-center rounded-lg bg-night text-white focus-ring sm:hidden"
              aria-label={t('nav.toggleMenu')}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Sub-navigation: segmented pill row */}
        <div className="border-t border-line-soft/80 px-2 sm:px-3">
          <div className="flex items-center justify-between gap-3">
            <nav
              className="flex items-center gap-1 overflow-x-auto py-1.5"
              aria-label={t('nav.subNavigation')}
            >
              {primaryLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`${NAV_LINK} ${isActive(link.to) ? NAV_ACTIVE : NAV_IDLE}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden shrink-0 items-center gap-1.5 pr-1 text-[11px] font-medium text-ink-soft lg:flex">
              <MapPin className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{t('nav.planningForPune')}</span>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav className="border-t border-line-soft px-3 py-3 text-sm sm:hidden">
            <div className="flex flex-col gap-1">
              {primaryLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive(link.to) ? 'bg-night text-white' : 'text-ink-soft hover:bg-paper-deep'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/methodology"
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive('/methodology')
                    ? 'bg-night text-white'
                    : 'text-ink-soft hover:bg-paper-deep'
                }`}
              >
                {t('nav.methodology')}
              </Link>
            </div>

            <div className="mt-3 border-t border-line-soft pt-3">
              <LanguageSwitcher />
            </div>

            <div className="mt-3 flex justify-between gap-2 border-t border-line-soft pt-3">
              {user ? (
                <>
                  <span className="flex flex-1 items-center truncate px-2 text-xs text-ink-soft">
                    {user.full_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex-1 rounded-lg border border-error/30 bg-panel py-2 text-center text-xs font-semibold text-error"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-lg border border-line bg-panel py-2 text-center text-xs font-semibold text-ink"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 rounded-lg bg-night py-2 text-center text-xs font-semibold text-white"
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

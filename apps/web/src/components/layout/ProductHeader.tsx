import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import buildSmartLogo from '../../assets/buildsmart-logo.png';
import { AuthContext } from '../../auth/context';
import { LanguageSwitcher } from './LanguageSwitcher';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProductHeader({ active }: { active?: 'projects' | 'estimate' | string }) {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const logout = auth?.logout;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    navigate('/login', { replace: true });
  };

  const displayName = user?.full_name || 'Aniket N.';
  const initials = initialsFor(displayName);

  return (
    <header className="product-header">
      <Link to="/" className="product-logo" aria-label={t('nav.homeAria') || 'BuildSmart home'}>
        <img src={buildSmartLogo} alt="BuildSmart AI" />
      </Link>
      <nav aria-label="Application navigation">
        <Link
          to="/app"
          className={active === 'projects' ? 'active' : ''}
        >
          {t('nav.projects') || 'Projects'}
        </Link>
        <Link
          to="/app/new"
          className={active === 'estimate' ? 'active' : ''}
        >
          {t('nav.newEstimate') || 'New estimate'}
        </Link>
        <Link to="/materials">
          {t('nav.materialsGuide') || 'Cost guide'}
        </Link>
        <Link to="/methodology">
          {t('nav.methodology') || 'Methodology'}
        </Link>
      </nav>
      <div className="product-user">
        <LanguageSwitcher />
        <span aria-hidden="true">{initials}</span>
        <div>
          <strong>{displayName}</strong>
          <small>{t('nav.projectOwner') || 'Project owner'}</small>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-[10px] text-ink-soft hover:text-ink ml-2"
          title={t('auth.logout') || 'Log out'}
        >
          {t('auth.logout') || 'Log out'}
        </button>
      </div>
    </header>
  );
}

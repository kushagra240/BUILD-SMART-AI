import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-ink/14 bg-paper text-ink-soft py-6 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-ink">
            <span className="font-headline font-semibold">BuildSmart AI</span>
            <span className="text-ink-soft">·</span>
            <span className="text-ink-soft">{t('footer.tagline')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-soft">
            <Link to="/methodology" className="hover:text-ink transition-colors">
              {t('nav.methodology')}
            </Link>
            <span aria-hidden="true">·</span>
            <span>{t('footer.region')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-ink">{t('footer.indicative')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

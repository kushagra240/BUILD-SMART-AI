import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto px-3 pb-3 pt-8 sm:px-5 sm:pb-4">
      <div className="mx-auto w-full max-w-shell rounded-xl bg-[#E5E9EF] px-6 py-6 sm:px-10">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5">
            <img src="/buildsmart-mark.png" alt="BuildSmart" className="h-7 w-7 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="font-headline text-sm font-extrabold tracking-[-0.04em] text-ink">
                BuildSmart AI
              </span>
              <span className="text-[11px] text-ink-soft">{t('footer.tagline')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-ink-soft">
            <span>{t('footer.region')}</span>
            <Link
              to="/methodology"
              className="transition-colors hover:text-accent focus-ring rounded"
            >
              {t('nav.methodology')}
            </Link>
            <span className="hidden h-1 w-1 rounded-full bg-ink-soft/50 sm:block" aria-hidden="true" />
            <span>{t('footer.indicative')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Two-panel shell for the login and register screens. The left panel is the
 * same dark, accent-lit slab used by the landing page's closing sections; the
 * right panel holds the form card. Copy is reused from existing translation
 * keys so no new strings (and no new translations) are introduced.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const highlights = [
    t('landing.highlights.categories'),
    t('landing.highlights.formatting'),
    t('landing.highlights.ranges'),
  ];

  return (
    <div className="app-surface px-4 pb-16 pt-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-shell grid-cols-1 overflow-hidden rounded-2xl border border-line bg-panel shadow-panel lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative flex flex-col justify-between gap-10 overflow-hidden bg-night p-8 text-white sm:p-10 lg:p-12">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 12% 8%, rgba(49,94,251,0.38), transparent 46%), radial-gradient(circle at 88% 92%, rgba(49,94,251,0.16), transparent 42%)',
            }}
            aria-hidden="true"
          />

          <div className="relative space-y-7">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded focus-ring"
              aria-label={t('nav.homeAria')}
            >
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-accent text-white shadow-[0_8px_20px_rgba(49,94,251,0.4)]">
                <Home className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-headline text-lg font-extrabold tracking-[-0.045em] text-white">
                BuildSmart
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/80">
                AI
              </span>
            </Link>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9FB6FF]">
                {t('nav.context')}
              </p>
              <p className="max-w-sm text-3xl font-extrabold leading-[1.05] tracking-[-0.05em] text-white sm:text-4xl">
                {t('footer.tagline')}
              </p>
              <p className="max-w-md text-sm leading-6 text-white/60">{t('landing.subtitle')}</p>
            </div>
          </div>

          <ul className="relative space-y-3 border-t border-white/10 pt-6 text-xs font-semibold text-white/75">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 flex-none text-[#9FB6FF]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">{children}</div>
      </div>
    </div>
  );
}

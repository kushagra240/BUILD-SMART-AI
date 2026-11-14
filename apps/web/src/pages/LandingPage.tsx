import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Layers,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

export function LandingPage() {
  const { t } = useTranslation();
  const highlights = [
    t('landing.highlights.categories'),
    t('landing.highlights.formatting'),
    t('landing.highlights.ranges'),
  ];
  const steps = [
    t('wizard.steps.projectSite'),
    t('wizard.steps.preferences'),
    t('wizard.steps.estimate'),
  ];

  return (
    <div className="app-surface min-h-screen pb-16 text-ink">
      {/* Hero */}
      <section className="mx-auto max-w-shell px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-accent">{t('landing.kicker')}</span>
              <SampleDataBadge text={t('common.sampleDataPrototype')} />
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.06em] text-ink sm:text-5xl lg:text-6xl">
              {t('landing.titleLead')}{' '}
              <span className="text-accent">{t('landing.titleAccent')}</span>
            </h1>

            <p className="max-w-xl text-base leading-7 text-ink-soft">{t('landing.subtitle')}</p>

            <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center">
              <Link to="/app/new" className="btn-primary">
                <Calculator className="h-4 w-4" aria-hidden="true" />
                <span>{t('landing.cta.start')}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/app" className="btn-ghost">
                <span>{t('landing.cta.overview')}</span>
              </Link>
              <Link
                to="/methodology"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:text-accent focus-ring"
              >
                <span>{t('landing.cta.methodology')}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Floating preview card */}
          <div className="lg:col-span-5">
            <div className="surface-card relative overflow-hidden p-6">
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(49,94,251,0.16), transparent 68%)',
                }}
                aria-hidden="true"
              />
              <div className="relative space-y-5">
                <div className="relative overflow-hidden rounded-xl border border-line-soft shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1691272477702-0a2edae135f2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=88&w=2000"
                    alt="Modern residential architecture in Pune"
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 rounded-lg bg-night/85 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                    <img src="/buildsmart-mark.png" alt="" className="h-4 w-4 object-contain" />
                    <span>Pune Residential Reference</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow">{t('nav.context')}</span>
                  <span className="rounded-md bg-accent-soft px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-accent">
                    {t('footer.region')}
                  </span>
                </div>

                <ol className="space-y-3">
                  {steps.map((step, index) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-night font-mono text-[11px] font-bold text-white">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-semibold text-ink">{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="border-t border-line-soft pt-4 text-[11px] leading-5 text-ink-soft">
                  {t('footer.indicative')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="mx-auto max-w-shell px-4 sm:px-6 lg:px-8">
        <ul className="surface-card grid grid-cols-1 divide-y divide-line-soft sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-2.5 px-5 py-4">
              <CheckCircle2 className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
              <span className="text-xs font-semibold text-ink">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-shell px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="max-w-2xl space-y-2">
          <span className="eyebrow text-accent">{t('landing.how.kicker')}</span>
          <h2 className="text-2xl font-extrabold tracking-[-0.045em] text-ink sm:text-3xl">
            {t('landing.how.title')}
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-line-soft lg:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=86&w=1200"
              alt="Contemporary multi-storey Indian residence in Pune"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <span className="absolute bottom-3 left-3 rounded-md bg-night/85 px-2.5 py-1 text-[10px] font-mono tracking-wider text-white backdrop-blur-md">
              Residential reference · Pune
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
            <article className="surface-card-interactive flex flex-col justify-between space-y-3 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-extrabold tracking-[-0.03em] text-ink">
                  {t('landing.features.allocation.title')}
                </h3>
                <p className="mt-2 text-xs leading-6 text-ink-soft">{t('landing.features.allocation.body')}</p>
              </div>
            </article>

            <article className="surface-card-interactive flex flex-col justify-between space-y-3 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-extrabold tracking-[-0.03em] text-ink">
                  {t('landing.features.zone.title')}
                </h3>
                <p className="mt-2 text-xs leading-6 text-ink-soft">{t('landing.features.zone.body')}</p>
              </div>
            </article>

            <article className="surface-card-interactive flex flex-col justify-between space-y-3 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-extrabold tracking-[-0.03em] text-ink">
                  {t('landing.features.ranges.title')}
                </h3>
                <p className="mt-2 text-xs leading-6 text-ink-soft">{t('landing.features.ranges.body')}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Dark closing CTA */}
      <section className="mx-auto max-w-shell px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-night p-8 text-white sm:p-10">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 12% 12%, rgba(49,94,251,0.36), transparent 46%), radial-gradient(circle at 88% 88%, rgba(49,94,251,0.18), transparent 42%)',
            }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl space-y-2">
              <div className="mb-2 flex items-center gap-2">
                <img src="/buildsmart-mark.png" alt="" className="h-6 w-6 object-contain" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent-soft">
                  BuildSmart AI
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-[-0.045em] text-white sm:text-3xl">
                {t('landing.notice.title')}
              </h2>
              <p className="text-sm leading-6 text-white/60">{t('landing.notice.body')}</p>
            </div>
            <Link
              to="/materials"
              className="btn-primary shrink-0 bg-accent hover:bg-accent-hover"
            >
              <span>{t('landing.notice.link')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const qualityRates = {
  Economy: 2000,
  Standard: 2400,
  Premium: 3100,
};

export function LandingPage() {
  const { t } = useTranslation();
  const [area, setArea] = useState(1800);
  const [quality, setQuality] = useState<'Economy' | 'Standard' | 'Premium'>('Standard');
  const [showCurtain, setShowCurtain] = useState(() => {
    try {
      return !sessionStorage.getItem('buildsmart_curtain_shown');
    } catch {
      return false;
    }
  });

  const estimate = useMemo(() => area * qualityRates[quality], [area, quality]);
  const estimateLabel = useMemo(
    () =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(estimate),
    [estimate]
  );

  useEffect(() => {
    if (showCurtain) {
      try {
        sessionStorage.setItem('buildsmart_curtain_shown', 'true');
      } catch {
        // Ignore sessionStorage write errors in restricted or incognito environments
      }
      const timer = setTimeout(() => setShowCurtain(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [showCurtain]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
    <div className="landing app-surface min-h-screen pb-16 text-ink">
      {/* Opening Intro Curtain */}
      {showCurtain && (
        <div className="intro-curtain" aria-hidden="true">
          <span className="intro-mark">
            <img src="/buildsmart-mark.png" alt="" />
          </span>
          <strong>BuildSmart</strong>
        </div>
      )}

      {/* Hero */}
      <section className="mx-auto max-w-shell px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-accent">{t('landing.kicker')}</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.06em] text-ink sm:text-5xl lg:text-6xl">
              {t('landing.titleLead')}{' '}
              <span className="text-accent">{t('landing.titleAccent')}</span>
            </h1>

            <p className="max-w-xl text-base leading-7 text-ink-soft">{t('landing.subtitle')}</p>

            <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:items-center">
              <Link to="/app/new" className="hero-cta group">
                <Calculator className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
                <span className="whitespace-nowrap">{t('landing.cta.start')}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
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
                    className="hero-photo h-44 w-full object-cover"
                    loading="lazy"
                  />
                  <svg className="blueprint" viewBox="0 0 500 300" aria-hidden="true">
                    <path d="M3 260h494M72 258V116l116-70 115 70v142M188 46l115 70 118-71v213M107 258v-93h58v93M224 258v-74h45v74M340 258V138h50v120" />
                    <path d="M55 276h265M55 286h195M72 102h348" />
                  </svg>
                  <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-2 rounded-lg bg-night/85 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
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
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
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

      {/* Interactive Quick Planner */}
      <section className="mx-auto max-w-shell px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8" id="planner">
        <div className="planner-section reveal">
          <div className="planner-copy">
            <p className="section-label light">Live Planning Calculator</p>
            <h2>
              Know your budget.
              <span className="block text-accent">Before you build.</span>
            </h2>
            <p>
              Adjust your home size and material specification to get a preliminary Pune-calibrated cost
              breakdown in real time.
            </p>
            <ul>
              <li>
                <CheckCircle2 className="h-4 w-4 text-accent" /> 9 cost categories
              </li>
              <li>
                <CheckCircle2 className="h-4 w-4 text-accent" /> 3 quality scenarios
              </li>
              <li>
                <CheckCircle2 className="h-4 w-4 text-accent" /> Current Pune rates
              </li>
            </ul>
          </div>

          <div className="planner-card">
            <div className="planner-card-head">
              <div>
                <small>Home Size & Quality</small>
                <h3>Preliminary Estimate</h3>
              </div>
              <span>
                <Sparkles className="h-5 w-5" />
              </span>
            </div>

            <div className="range-label">
              <span>Built-up area</span>
              <strong>{area.toLocaleString('en-IN')} sq ft</strong>
            </div>

            <input
              type="range"
              min={600}
              max={5000}
              step={100}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="area-range"
              aria-label="Built-up area slider in square feet"
              style={{
                ['--range-progress' as string]: `${((area - 600) / (5000 - 600)) * 100}%`,
              }}
            />

            <div className="range-scale">
              <span>600 sq ft</span>
              <span>Typical Pune: 1,800 sq ft</span>
              <span>5,000 sq ft</span>
            </div>

            <fieldset>
              <legend>Construction quality</legend>
              <div className="quality-options">
                {(['Economy', 'Standard', 'Premium'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setQuality(tier)}
                    className={quality === tier ? 'quality-active' : ''}
                  >
                    <strong>{tier}</strong>
                    <small>₹{qualityRates[tier].toLocaleString('en-IN')}/sq ft</small>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="planner-result">
              <div>
                <span>Estimated build cost</span>
                <strong>{estimateLabel}</strong>
              </div>
              <div className="result-note">
                <span>₹{qualityRates[quality].toLocaleString('en-IN')} / sq ft</span>
              </div>
            </div>

            <Link to="/app/new" className="planner-button">
              Create detailed estimate <ArrowRight className="h-4 w-4" />
            </Link>
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

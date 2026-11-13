import { Link } from 'react-router-dom';
import { ArrowRight, Database, Layers, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

/**
 * Illustrative allocation, unchanged from the original page. These shares are
 * static copy, not engine output, and are the known gap tracked by T41 (one
 * category list, no hard-coded business numbers). Dot colours come from the
 * shared `chart` palette so the legend matches the results donut.
 */
const CATEGORIES = [
  { key: 'foundation', share: '12%', dot: 'bg-chart-foundation' },
  { key: 'structure', share: '31%', dot: 'bg-chart-structure' },
  { key: 'masonry', share: '18%', dot: 'bg-chart-masonry' },
  { key: 'flooring', share: '10%', dot: 'bg-chart-flooring' },
  { key: 'roofing', share: '10%', dot: 'bg-chart-roofing' },
  { key: 'electrical', share: '7%', dot: 'bg-chart-electrical' },
  { key: 'plumbing', share: '7%', dot: 'bg-chart-plumbing' },
  { key: 'finishing', share: '7%', dot: 'bg-chart-finishing' },
  { key: 'labour', share: '5%', dot: 'bg-chart-labour' },
] as const;

export function MethodologyPage() {
  const { t } = useTranslation();
  return (
    <div className="app-surface min-h-screen pb-16 pt-6 text-ink">
      <div className="mx-auto max-w-4xl space-y-7 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-accent">{t('methodology.kicker')}</span>
            <SampleDataBadge text={t('common.sampleData')} />
          </div>
          <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
            {t('methodology.title')}
          </h1>
          <p className="text-sm leading-6 text-ink-soft">{t('methodology.subtitle')}</p>
        </header>

        {/* Estimation engine */}
        <section className="surface-card space-y-4 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-accent-soft text-accent">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="section-title">{t('methodology.engine.title')}</h2>
          </div>
          <p className="text-sm leading-6 text-ink-soft">
            {t('methodology.engine.bodyBefore')}{' '}
            <code className="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-xs text-accent">
              log(total_cost_inr)
            </code>{' '}
            {t('methodology.engine.bodyAfter')}
          </p>
        </section>

        {/* Data provenance */}
        <section className="surface-card space-y-4 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-accent-soft text-accent">
              <Database className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="section-title">{t('methodology.data.title')}</h2>
          </div>
          <p className="text-sm leading-6 text-ink-soft">{t('methodology.data.intro')}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2 rounded-xl border border-line bg-paper p-4">
              <span className="inline-block rounded bg-night px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                {t('methodology.tags.real')}
              </span>
              <p className="text-[11px] leading-5 text-ink-soft">{t('methodology.tags.realBody')}</p>
            </div>
            <div className="space-y-2 rounded-xl border border-line bg-paper p-4">
              <span className="inline-block rounded bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent">
                {t('methodology.tags.published')}
              </span>
              <p className="text-[11px] leading-5 text-ink-soft">
                {t('methodology.tags.publishedBody')}
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-line bg-paper p-4">
              <span className="inline-block rounded bg-ochre/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
                {t('methodology.tags.synthetic')}
              </span>
              <p className="text-[11px] leading-5 text-ink-soft">
                {t('methodology.tags.syntheticBody')}
              </p>
            </div>
          </div>
        </section>

        {/* Nine-category allocation */}
        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft px-6 py-5">
            <h2 className="section-title">{t('methodology.categories.title')}</h2>
            <span className="text-[11px] font-semibold text-ink-soft">
              {t('methodology.categories.total')}
            </span>
          </div>
          <ul className="divide-y divide-line-soft">
            {CATEGORIES.map((cat) => (
              <li
                key={cat.key}
                className="flex flex-col justify-between gap-2 px-6 py-3.5 text-sm transition-colors hover:bg-paper-deep/30 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 flex-none rounded-full ${cat.dot}`}
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-ink">
                    {t(`methodology.categories.${cat.key}.name`)}
                  </span>
                  <span className="hidden text-[11px] text-ink-soft sm:inline">
                    — {t(`methodology.categories.${cat.key}.desc`)}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-ink">{cat.share}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Scope and limitations */}
        <section className="relative overflow-hidden rounded-2xl bg-night p-6 text-white sm:p-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 86% 10%, rgba(49,94,251,0.36), transparent 46%)',
            }}
            aria-hidden="true"
          />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white/10 text-white">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-extrabold tracking-[-0.04em] text-white">
                {t('methodology.scope.title')}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-white/65">{t('methodology.scope.body')}</p>
            <Link to="/app/new" className="btn-primary bg-accent hover:bg-accent-hover">
              <span>{t('methodology.scope.cta')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

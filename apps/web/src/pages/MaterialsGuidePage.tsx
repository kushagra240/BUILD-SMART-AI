import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Info, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

const ROWS = [
  'structure',
  'walling',
  'flooring',
  'doors',
  'windows',
  'electrical',
  'plumbing',
  'paint',
  'waterproofing',
] as const;

const TIERS = ['economy', 'standard', 'premium'] as const;

export function MaterialsGuidePage() {
  const { t } = useTranslation();
  return (
    <div className="app-surface min-h-screen pb-16 pt-6 text-ink">
      <div className="mx-auto max-w-shell space-y-7 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow text-accent">{t('materials.kicker')}</span>
              <SampleDataBadge text={t('common.sampleData')} />
            </div>
            <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
              {t('materials.title')}
            </h1>
            <p className="text-sm leading-6 text-ink-soft">{t('materials.subtitle')}</p>
          </div>

          <Link to="/app/estimates/BS-2026-004" className="btn-ghost h-10 shrink-0 px-3.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('materials.back')}</span>
          </Link>
        </header>

        {/* Intro + material moodboard */}
        <section className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
          <div className="surface-card space-y-4 p-6 sm:p-8 lg:col-span-8">
            <span className="eyebrow">{t('materials.table.material')}</span>
            <h2 className="text-2xl font-extrabold tracking-[-0.045em] text-ink">
              {t('materials.intro.title')}
            </h2>
            <p className="text-sm leading-6 text-ink-soft">{t('materials.intro.body')}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold">
              <span className="rounded-md bg-night px-2.5 py-1 text-white">
                {t('materials.badges.standard')}
              </span>
              <span className="rounded-md bg-paper-deep px-2.5 py-1 text-ink-soft">
                {t('materials.badges.spec')}
              </span>
              <span className="rounded-md bg-accent-soft px-2.5 py-1 text-accent">
                {t('materials.badges.total')}
              </span>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-accent-soft/70 px-4 py-3.5 text-xs leading-6 text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
              <p>
                <strong className="font-bold text-ink">{t('materials.monsoon.title')}</strong>{' '}
                {t('materials.monsoon.body')}
              </p>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-night p-6 text-white lg:col-span-4">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 84% 10%, rgba(49,94,251,0.36), transparent 48%)',
              }}
              aria-hidden="true"
            />
            <div className="relative space-y-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9FB6FF]">
                {t('materials.moodboard.caption')}
              </p>
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-2">
              <div className="flex h-24 flex-col justify-end rounded-lg border border-white/15 bg-white/95 p-2 text-[10px] font-semibold text-ink">
                <span>{t('materials.moodboard.wood')}</span>
              </div>
              <div className="flex h-24 flex-col justify-end rounded-lg border border-accent/40 bg-accent/25 p-2 text-[10px] font-semibold text-white">
                <span>{t('materials.moodboard.clay')}</span>
              </div>
              <div className="flex h-24 flex-col justify-end rounded-lg border border-white/20 bg-white/10 p-2 text-[10px] font-semibold text-white/80">
                <span>{t('materials.moodboard.upvc')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Three approaches table */}
        <section className="space-y-3">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
            <h2 className="section-title">{t('materials.table.title')}</h2>
            <span className="text-[11px] font-semibold text-ink-soft">
              {t('materials.table.note')}
            </span>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-paper-deep/70 text-ink-soft">
                  <tr>
                    <th
                      scope="col"
                      className="w-1/4 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                    >
                      {t('materials.table.material')}
                    </th>
                    <th
                      scope="col"
                      className="w-1/4 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                    >
                      <div>{t('enum.quality.economy')}</div>
                      <div className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-ink-soft">
                        {t('materials.table.rateEconomy')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="w-1/4 border-x border-accent/20 bg-accent-soft/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{t('enum.quality.standard')}</span>
                        <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {t('materials.table.selected')}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-ink-soft">
                        {t('materials.table.rateStandard')}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="w-1/4 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em]"
                    >
                      <div>{t('enum.quality.premium')}</div>
                      <div className="mt-0.5 text-[10px] font-medium normal-case tracking-normal text-ink-soft">
                        {t('materials.table.ratePremium')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {ROWS.map((row) => (
                    <tr key={row} className="transition-colors hover:bg-paper-deep/30">
                      <td className="px-4 py-3 font-semibold text-ink">{t(`materials.rows.${row}`)}</td>
                      {TIERS.map((tier) => (
                        <td
                          key={tier}
                          className={
                            tier === 'standard'
                              ? 'border-x border-accent/20 bg-accent-soft/40 px-4 py-3 font-semibold text-ink'
                              : 'px-4 py-3 text-ink-soft'
                          }
                        >
                          {t(`materials.cells.${row}.${tier}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] leading-5 text-ink-soft">{t('materials.footnote')}</p>
        </section>

        {/* Review cards */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="surface-card flex flex-col gap-2.5 p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-extrabold tracking-[-0.03em] text-ink">
                {t('materials.reviews.aac.title')}
              </h3>
              <span className="rounded bg-paper-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-ink-soft">
                {t('materials.reviews.badge')}
              </span>
            </div>
            <p className="text-xs leading-6 text-ink-soft">{t('materials.reviews.aac.body')}</p>
            <p className="mt-auto border-t border-line-soft pt-2.5 text-[11px] leading-5 text-ink-soft">
              {t('materials.reviews.aac.note')}
            </p>
          </article>

          <article className="surface-card flex flex-col gap-2.5 p-5">
            <h3 className="text-base font-extrabold tracking-[-0.03em] text-ink">
              {t('materials.reviews.vitrified.title')}
            </h3>
            <p className="text-xs leading-6 text-ink-soft">
              {t('materials.reviews.vitrified.body')}
            </p>
            <p className="mt-auto border-t border-line-soft pt-2.5 text-[11px] leading-5 text-ink-soft">
              {t('materials.reviews.vitrified.note')}
            </p>
          </article>

          <article className="surface-card flex flex-col gap-2.5 p-5">
            <h3 className="text-base font-extrabold tracking-[-0.03em] text-ink">
              {t('materials.reviews.details.title')}
            </h3>
            <p className="text-xs leading-6 text-ink-soft">{t('materials.reviews.details.body')}</p>
            <p className="mt-auto border-t border-line-soft pt-2.5 text-[11px] leading-5 text-ink-soft">
              {t('materials.reviews.details.note')}
            </p>
          </article>
        </section>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 rounded-xl border border-line bg-panel px-5 py-4 text-xs leading-6 text-ink-soft">
          <Info className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
          <p>
            <strong className="font-bold text-ink">{t('materials.disclaimer.title')}</strong>{' '}
            {t('materials.disclaimer.body')}
          </p>
        </div>

        <div>
          <Link to="/app/new" className="btn-primary h-10 px-4 text-xs">
            <span>{t('landing.cta.start')}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
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
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Header and Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                {t('materials.kicker')}
              </span>
              <SampleDataBadge text={t('common.sampleData')} />
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              {t('materials.title')}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              {t('materials.subtitle')}
            </p>
          </div>

          <Link
            to="/app/estimates/BS-2026-004"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors whitespace-nowrap focus-ring"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-ink-soft" />
            <span>{t('materials.back')}</span>
          </Link>
        </div>

        {/* Intro Section: Spend on what you won't want to replace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4 font-sans">
            <h2 className="font-headline text-2xl font-bold text-ink">
              {t('materials.intro.title')}
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              {t('materials.intro.body')}
            </p>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-forest text-paper font-semibold">
                {t('materials.badges.standard')}
              </span>
              <span className="px-2.5 py-1 rounded bg-clay border border-ink/14 text-ink">
                {t('materials.badges.spec')}
              </span>
              <span className="px-2.5 py-1 rounded bg-paper-deep border border-ink/14 text-brick font-bold">
                {t('materials.badges.total')}
              </span>
            </div>

            {/* Pune Monsoon Callout */}
            <div className="bg-clay/50 border border-ink/14 rounded-lg p-4 space-y-1 text-xs">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <Info className="w-4 h-4 text-forest" />
                <span>{t('materials.monsoon.title')}</span>
              </div>
              <p className="text-ink-soft leading-relaxed">
                {t('materials.monsoon.body')}
              </p>
            </div>
          </div>

          {/* Right Materials Moodboard Vignette */}
          <div className="lg:col-span-4 bg-paper-deep/60 border border-ink/14 rounded-lg p-4 space-y-2">
            <div className="w-full h-44 rounded bg-clay/60 border border-ink/14 p-3 flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-2 h-full">
                <div className="bg-paper border border-ink/14 rounded p-2 flex flex-col justify-end text-[10px] font-mono text-ink">
                  <span>{t('materials.moodboard.wood')}</span>
                </div>
                <div className="bg-brick/20 border border-brick/40 rounded p-2 flex flex-col justify-end text-[10px] font-mono text-brick">
                  <span>{t('materials.moodboard.clay')}</span>
                </div>
                <div className="bg-forest/15 border border-forest/30 rounded p-2 flex flex-col justify-end text-[10px] font-mono text-forest">
                  <span>{t('materials.moodboard.upvc')}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-ink-soft text-center italic">
              {t('materials.moodboard.caption')}
            </p>
          </div>
        </div>

        {/* Three approaches table */}
        <div className="space-y-3 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-ink/14 pb-2">
            <h2 className="font-headline text-xl font-bold text-ink">
              {t('materials.table.title')}
            </h2>
            <span className="text-xs font-mono text-ink-soft">
              {t('materials.table.note')}
            </span>
          </div>

          <div className="border border-ink/14 rounded-lg overflow-hidden bg-paper shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-deep/70 text-ink-soft font-mono uppercase text-[10px] tracking-wider border-b border-ink/14">
                  <tr>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4">
                      {t('materials.table.material')}
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4">
                      <div>{t('enum.quality.economy')}</div>
                      <div className="text-[10px] lowercase font-normal text-ink-soft">
                        {t('materials.table.rateEconomy')}
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4 bg-clay/50 text-ink border-l border-r border-ink/14">
                      <div className="flex items-center gap-1.5">
                        <span>{t('enum.quality.standard')}</span>
                        <span className="px-1.5 py-0.2 rounded bg-forest text-paper text-[9px]">
                          {t('materials.table.selected')}
                        </span>
                      </div>
                      <div className="text-[10px] lowercase font-normal text-ink-soft">
                        {t('materials.table.rateStandard')}
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold w-1/4">
                      <div>{t('enum.quality.premium')}</div>
                      <div className="text-[10px] lowercase font-normal text-ink-soft">
                        {t('materials.table.ratePremium')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 font-sans">
                  {ROWS.map((row) => (
                    <tr key={row}>
                      <td className="py-3 px-4 font-medium text-ink">
                        {t(`materials.rows.${row}`)}
                      </td>
                      {TIERS.map((tier) => (
                        <td
                          key={tier}
                          className={
                            tier === 'standard'
                              ? 'py-3 px-4 bg-clay/20 font-medium text-ink border-l border-r border-ink/14'
                              : 'py-3 px-4 text-ink-soft'
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

          <p className="text-[11px] text-ink-soft leading-relaxed">
            {t('materials.footnote')}
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
          <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-base font-bold text-ink">
                {t('materials.reviews.aac.title')}
              </h3>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-clay text-ink-soft font-semibold">
                {t('materials.reviews.badge')}
              </span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {t('materials.reviews.aac.body')}
            </p>
            <p className="text-[11px] text-ink-soft border-t border-ink/10 pt-2">
              {t('materials.reviews.aac.note')}
            </p>
          </div>

          <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 space-y-2.5">
            <h3 className="font-headline text-base font-bold text-ink">
              {t('materials.reviews.vitrified.title')}
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              {t('materials.reviews.vitrified.body')}
            </p>
            <p className="text-[11px] text-ink-soft border-t border-ink/10 pt-2">
              {t('materials.reviews.vitrified.note')}
            </p>
          </div>

          <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 space-y-2.5">
            <h3 className="font-headline text-base font-bold text-ink">
              {t('materials.reviews.details.title')}
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed">
              {t('materials.reviews.details.body')}
            </p>
            <p className="text-[11px] text-ink-soft border-t border-ink/10 pt-2">
              {t('materials.reviews.details.note')}
            </p>
          </div>
        </div>

        {/* Disclaimer Callout Box */}
        <div className="bg-clay/50 border border-ink/14 rounded-lg p-4 text-xs text-ink-soft leading-relaxed">
          <strong className="text-ink font-sans">
            {t('materials.disclaimer.title')}
          </strong>{' '}
          {t('materials.disclaimer.body')}
        </div>
      </div>
    </div>
  );
}

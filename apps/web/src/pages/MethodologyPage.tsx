import { Link } from 'react-router-dom';
import { Layers, ShieldCheck, Database, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

const CATEGORIES = [
  { key: 'foundation', share: '12%', color: '#6B4F3A' },
  { key: 'structure', share: '31%', color: '#1F4D45' },
  { key: 'masonry', share: '18%', color: '#B4472B' },
  { key: 'flooring', share: '10%', color: '#D9A441' },
  { key: 'roofing', share: '10%', color: '#8A6FA0' },
  { key: 'electrical', share: '7%', color: '#9BB05A' },
  { key: 'plumbing', share: '7%', color: '#4F86A6' },
  { key: 'finishing', share: '7%', color: '#D88C9A' },
  { key: 'labour', share: '5%', color: '#3A3F3C' },
] as const;

export function MethodologyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-ink/10 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
              {t('methodology.kicker')}
            </span>
            <SampleDataBadge text={t('common.sampleData')} />
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            {t('methodology.title')}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-2xl font-sans">
            {t('methodology.subtitle')}
          </p>
        </div>

        {/* Estimation Engine Architecture */}
        <section className="bg-paper-deep/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-clay border border-ink/14 flex items-center justify-center text-forest">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="font-headline text-xl font-bold text-ink">
              {t('methodology.engine.title')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-sans">
            {t('methodology.engine.bodyBefore')}{' '}
            <code className="bg-paper px-1.5 py-0.5 rounded font-mono text-brick border border-ink/10">
              log(total_cost_inr)
            </code>{' '}
            {t('methodology.engine.bodyAfter')}
          </p>
        </section>

        {/* Data Provenance Section */}
        <section className="bg-paper-deep/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-clay border border-ink/14 flex items-center justify-center text-forest">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="font-headline text-xl font-bold text-ink">
              {t('methodology.data.title')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed font-sans">
            {t('methodology.data.intro')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-paper border border-ink/14 rounded p-3 space-y-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-forest text-paper">
                {t('methodology.tags.real')}
              </span>
              <p className="text-[11px] text-ink-soft">
                {t('methodology.tags.realBody')}
              </p>
            </div>
            <div className="bg-paper border border-ink/14 rounded p-3 space-y-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-clay text-ink border border-ink/14">
                {t('methodology.tags.published')}
              </span>
              <p className="text-[11px] text-ink-soft">
                {t('methodology.tags.publishedBody')}
              </p>
            </div>
            <div className="bg-paper border border-ink/14 rounded p-3 space-y-1">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-ochre/30 text-ink">
                {t('methodology.tags.synthetic')}
              </span>
              <p className="text-[11px] text-ink-soft">
                {t('methodology.tags.syntheticBody')}
              </p>
            </div>
          </div>
        </section>

        {/* 9 Categories Allocation */}
        <section className="bg-paper-deep/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <h2 className="font-headline text-xl font-bold text-ink">
              {t('methodology.categories.title')}
            </h2>
            <span className="text-xs font-mono text-ink-soft">
              {t('methodology.categories.total')}
            </span>
          </div>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                className="bg-paper border border-ink/14 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-ink">
                    {t(`methodology.categories.${cat.key}.name`)}
                  </span>
                  <span className="text-ink-soft text-[11px] hidden sm:inline">
                    — {t(`methodology.categories.${cat.key}.desc`)}
                  </span>
                </div>
                <span className="font-mono font-bold text-ink text-right">{cat.share}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Honest Limitations & Scope */}
        <section className="bg-clay/50 border border-ink/14 rounded-lg p-6 sm:p-8 space-y-3 font-sans">
          <h2 className="font-headline text-lg font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest" />
            <span>{t('methodology.scope.title')}</span>
          </h2>
          <p className="text-xs text-ink-soft leading-relaxed">
            {t('methodology.scope.body')}
          </p>
          <div className="pt-2">
            <Link
              to="/app/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-brick hover:bg-brick-hover text-paper text-xs font-medium shadow-subtle transition-colors focus-ring"
            >
              <span>{t('methodology.scope.cta')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Calculator, ArrowRight, ShieldCheck, Layers, MapPin, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SampleDataBadge } from '../components/common/SampleDataBadge';

export function LandingPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-paper text-ink space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="pt-8 sm:pt-14 pb-12 border-b border-ink/14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                {t('landing.kicker')}
              </span>
              <SampleDataBadge text={t('common.sampleDataPrototype')} />
            </div>

            <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.12]">
              {t('landing.titleLead')}{' '}
              <span className="text-brick italic font-serif">{t('landing.titleAccent')}</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl font-sans">
              {t('landing.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
              <Link
                to="/app/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-brick hover:bg-brick-hover text-paper font-medium text-sm shadow-subtle transition-colors focus-ring"
              >
                <Calculator className="w-4 h-4" aria-hidden="true" />
                <span>{t('landing.cta.start')}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-paper-deep hover:bg-clay text-ink font-medium text-sm border border-ink/14 transition-colors focus-ring"
              >
                <span>{t('landing.cta.overview')}</span>
              </Link>
              <Link
                to="/methodology"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-ink-soft hover:text-ink text-sm transition-colors focus-ring"
              >
                <span>{t('landing.cta.methodology')}</span>
              </Link>
            </div>

            {/* Quick Highlights Bar */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-ink/10 text-xs text-ink-soft font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <span>{t('landing.highlights.categories')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <span>{t('landing.highlights.formatting')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-forest flex-shrink-0" />
                <span>{t('landing.highlights.ranges')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature / Principles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-ink-soft">
              {t('landing.how.kicker')}
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-ink">
              {t('landing.how.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-forest/10 border border-forest/20 text-forest flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-headline text-lg font-bold text-ink">
                {t('landing.features.allocation.title')}
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans">
                {t('landing.features.allocation.body')}
              </p>
            </div>

            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-brick/10 border border-brick/20 text-brick flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="font-headline text-lg font-bold text-ink">
                {t('landing.features.zone.title')}
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans">
                {t('landing.features.zone.body')}
              </p>
            </div>

            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 space-y-3">
              <div className="w-8 h-8 rounded bg-ochre/20 border border-ochre/40 text-ink flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-ink" />
              </div>
              <h3 className="font-headline text-lg font-bold text-ink">
                {t('landing.features.ranges.title')}
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed font-sans">
                {t('landing.features.ranges.body')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Before You Commit Notice */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-clay/50 border border-ink/14 rounded-lg p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="font-headline text-xl font-bold text-ink">
              {t('landing.notice.title')}
            </h3>
            <p className="text-xs text-ink-soft leading-relaxed font-sans">
              {t('landing.notice.body')}
            </p>
          </div>
          <Link
            to="/materials"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md bg-paper border border-ink/14 text-ink hover:bg-paper-deep text-xs font-medium transition-colors whitespace-nowrap focus-ring"
          >
            <span>{t('landing.notice.link')}</span>
            <ArrowRight className="w-3.5 h-3.5 text-brick" />
          </Link>
        </div>
      </section>
    </div>
  );
}

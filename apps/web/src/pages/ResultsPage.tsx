import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Download, Info, Layers, Ruler, TrendingUp, Wallet } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { apiClient, type EstimateResponse } from '../services/apiClient';
import { apiErrorMessage } from '../lib/errorMessage';
import { formatDateTime, formatINR, formatNumber } from '../lib/formatters';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ErrorState, LoadingState } from '../components/common/AsyncState';
import {
  translateCategory,
  translateConstruction,
  translateMaterialCategory,
  translateQuality,
  translateZone,
} from '../i18n/labels';

// Colour ramp for the cost categories: dark neutral -> accent blue -> cool
// grey, matching the design system. Lookup keys are the lowercase contract
// values (`enum.categories.*`), compared case- and separator-insensitively so
// `Foundation` and `foundation` resolve to the same colour.
const CATEGORY_CHART_COLORS: Record<string, string> = {
  foundation: '#151820',
  structure: '#315EFB',
  masonry: '#6685F4',
  roofing: '#2455E6',
  flooring: '#8FA8F5',
  plumbing: '#8F98A8',
  electrical: '#B7C2D8',
  finishing: '#5C6470',
  labour: '#AFC4FB',
};

const CATEGORY_CHART_RAMP = Object.values(CATEGORY_CHART_COLORS);

/**
 * A category the ramp does not know (a stub payload or a future contract
 * addition) still gets its own colour, derived from its position in the
 * breakdown. Keeps the donut readable without inventing labels.
 */
function getCategoryColor(name: string, index = 0): string {
  const key = name.trim().toLowerCase();
  return CATEGORY_CHART_COLORS[key] ?? CATEGORY_CHART_RAMP[index % CATEGORY_CHART_RAMP.length];
}

/** Humanises a contract dictionary key such as `unit_rate_inr`. */
function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

/**
 * `gap_inr` is a surplus for `within` and a shortfall for `tight` / `below_minimum`
 * (see apps/api/app/services/estimation.py). The stored-estimate read path returns
 * `gap_inr: 0`, so only show an amount when one is actually present.
 */
function formatBudget(budget: EstimateResponse['budget'], t: TFunction): string {
  if (budget.status === 'not_provided') {
    return t('results.budget.notProvided');
  }
  const statusLabel = t(`results.budget.status.${budget.status}`, {
    defaultValue: t(`enum.budgetStatus.${budget.status}`, { defaultValue: budget.status }),
  });
  if (budget.gap_inr <= 0) {
    return budget.status === 'within' ? t('results.budget.within') : statusLabel;
  }
  const amount = formatINR(budget.gap_inr);
  if (budget.status === 'within') {
    return t('results.budget.above', { amount });
  }
  return t('results.budget.short', { status: statusLabel, amount });
}

type ResultsLocationState = {
  estimate?: unknown;
  projectName?: string;
  locality?: string;
};

/**
 * Hand a blob to the browser's own download flow. Extracted so jsdom tests can
 * stub `URL.createObjectURL` and anchor clicks without touching the page logic.
 */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    // Revoke after the click has been dispatched; revoking synchronously breaks
    // the download in some browsers.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Guard against stale/partial navigation state before trusting it. */
function isEstimateResponse(value: unknown): value is EstimateResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<EstimateResponse>;
  const total = candidate.total as Partial<EstimateResponse['total']> | undefined;
  const inputs = candidate.inputs as Partial<EstimateResponse['inputs']> | undefined;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.project_id === 'string' &&
    typeof total === 'object' &&
    total !== null &&
    typeof total.p50 === 'number' &&
    typeof inputs === 'object' &&
    inputs !== null &&
    typeof inputs.built_up_area_sqft === 'number' &&
    Array.isArray(candidate.breakdown) &&
    typeof candidate.is_mock === 'boolean'
  );
}

/**
 * Compare two contract dictionaries (`primary` / `alternative`) as a table.
 * Keys are never hardcoded: rows are the union of the keys the API sent, so a
 * new backend field appears without a frontend change.
 */
function MaterialComparison({
  label,
  primary,
  alternative,
}: {
  label: string;
  primary: Record<string, string | number>;
  alternative: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  const keys = Array.from(new Set([...Object.keys(primary), ...Object.keys(alternative)]));

  if (keys.length === 0) {
    return (
      <p className="border-t border-line-soft px-5 py-4 text-sm text-ink-soft">
        {t('results.materials.noSpec')}
      </p>
    );
  }

  const renderValue = (source: Record<string, string | number>, key: string) => {
    const value = source[key];
    if (value === undefined || value === '') {
      return <span className="italic text-ink-soft/70">{t('common.notProvided')}</span>;
    }
    return typeof value === 'number' ? formatNumber(value) : value;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-y border-line-soft bg-paper-deep/50 text-left">
            <th
              scope="col"
              className="w-[30%] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft"
            >
              {t('results.materials.specification')}
            </th>
            <th
              scope="col"
              className="w-[35%] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft"
            >
              {t('results.materials.primary')}
            </th>
            <th
              scope="col"
              className="w-[35%] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft"
            >
              {t('results.materials.alternative')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {keys.map((key) => (
            <tr key={key} className="align-top">
              <th
                scope="row"
                className="break-words px-5 py-3 text-left font-semibold text-ink-soft"
              >
                {titleCase(key)}
              </th>
              <td className="break-words px-5 py-3 text-ink">{renderValue(primary, key)}</td>
              <td className="break-words px-5 py-3 text-ink">{renderValue(alternative, key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Cost split donut. The table next to it is the accessible data alternative:
 * the SVG is decorative to assistive technology.
 */
function BudgetDonut({
  breakdown,
  total,
  t,
}: {
  breakdown: EstimateResponse['breakdown'];
  total: number;
  t: TFunction;
}) {
  const data = breakdown.map((item, index) => ({
    key: item.category,
    name: translateCategory(t, item.category),
    value: item.amount,
    fill: getCategoryColor(item.category, index),
  }));

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="h-[260px] w-full" data-testid="budget-donut" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 300, height: 260 }}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="#FBFCFE"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatINR(Number(value))}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #DCE1E8',
                background: '#FBFCFE',
                boxShadow: '0 18px 40px rgba(18,24,35,0.13)',
                fontSize: 12,
                padding: '8px 12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        aria-hidden="true"
      >
        <span className="max-w-[8.5rem] text-[9px] font-bold uppercase tracking-[0.14em] text-ink-soft">
          {t('results.breakdown.total')}
        </span>
        <span className="mt-1.5 text-2xl font-extrabold tracking-[-0.05em] text-ink">
          {formatINR(total)}
        </span>
      </div>
    </div>
  );
}

export function ResultsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = (location.state ?? null) as ResultsLocationState | null;
  const reduceMotion = useReducedMotion();

  const [estimate, setEstimate] = useState<EstimateResponse | null>(() =>
    isEstimateResponse(locationState?.estimate) ? locationState.estimate : null
  );
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'redirect'>(() => {
    if (estimate) return 'success';
    return id ? 'loading' : 'redirect';
  });
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (estimate) {
      return;
    }
    if (!id) {
      setStatus('redirect');
      return;
    }

    let active = true;
    setStatus('loading');
    setError(null);

    apiClient
      .getEstimate(id)
      .then((response) => {
        if (!active) return;
        setEstimate(response);
        setStatus('success');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(apiErrorMessage(cause, t('results.errors.load')));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [estimate, id, reloadKey, t]);

  /**
   * Ask the API for the PDF and hand the bytes to the browser. Failures only
   * affect the button area: the estimate itself stays readable.
   */
  const handleDownloadPdf = async () => {
    if (!estimate || pdfStatus === 'loading') {
      return;
    }

    setPdfStatus('loading');
    setPdfError(null);

    try {
      const blob = await apiClient.downloadEstimatePdf(estimate.project_id, estimate.id);
      saveBlob(blob, `buildsmart-estimate-${shortId(estimate.id)}.pdf`);
      setPdfStatus('idle');
    } catch (cause: unknown) {
      setPdfError(apiErrorMessage(cause, t('results.errors.pdf')));
      setPdfStatus('error');
    }
  };

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.1 },
    },
  };

  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: 'easeOut' },
        },
      };

  if (status === 'redirect') {
    return <Navigate to="/app" replace />;
  }

  if (status === 'loading') {
    return (
      <div className="app-surface flex min-h-[60vh] flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <LoadingState label={t('results.loading')} />
        </div>
      </div>
    );
  }

  if (status === 'error' || !estimate) {
    return (
      <div className="app-surface min-h-screen px-4 py-10 text-ink">
        <div className="mx-auto max-w-2xl space-y-5">
          <ErrorState
            message={error ?? t('results.errors.load')}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/app" className="rounded font-semibold text-accent hover:underline focus-ring">
              {t('results.backDashboard')}
            </Link>
            <Link
              to="/app/new"
              className="rounded font-semibold text-accent hover:underline focus-ring"
            >
              {t('results.startNewEstimate')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const projectName = locationState?.projectName;
  const locality = locationState?.locality;
  const areaSqFt = estimate.inputs.built_up_area_sqft;
  const totalCost = estimate.total.p50;
  const ratePerSqFt = areaSqFt > 0 ? Math.round(totalCost / areaSqFt) : 0;
  const shareTotal = Math.round(
    estimate.breakdown.reduce((sum, category) => sum + category.share_pct, 0)
  );
  const floors = estimate.inputs.floors;
  const subtitle = [
    locality,
    floors ? t('results.subtitle.floorCount', { count: floors }) : null,
    t('results.subtitle.area', { area: formatNumber(areaSqFt) }),
    t('results.subtitle.quality', {
      quality: translateQuality(t, estimate.inputs.quality_tier),
    }),
    t('results.subtitle.zone', { zone: translateZone(t, estimate.inputs.zone_id) }),
  ]
    .filter(Boolean)
    .join(' · ');

  const inputRows: Array<[string, string]> = [
    [t('results.inputs.construction'), translateConstruction(t, estimate.inputs.construction_type)],
    [t('results.inputs.quality'), translateQuality(t, estimate.inputs.quality_tier)],
    [t('results.inputs.zone'), translateZone(t, estimate.inputs.zone_id)],
    [t('results.inputs.floors'), String(estimate.inputs.floors)],
    [t('results.inputs.bedrooms'), String(estimate.inputs.bedrooms)],
    [t('results.inputs.bathrooms'), String(estimate.inputs.bathrooms)],
    [
      t('results.inputs.plotArea'),
      estimate.inputs.plot_area_sqft
        ? `${formatNumber(estimate.inputs.plot_area_sqft)} ${t('common.sqFt')}`
        : t('common.notProvided'),
    ],
    [t('results.inputs.budget'), formatBudget(estimate.budget, t)],
  ];

  const steps = [
    t('results.steps.projectSite'),
    t('results.steps.preferences'),
    t('results.steps.estimate'),
  ];

  return (
    <div className="app-surface min-h-screen px-4 pb-16 pt-6 text-ink sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto max-w-shell space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Toolbar: progress, provenance and primary actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <ol className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            {steps.map((label, index) => {
              const stepNumber = index + 1;
              const isCurrent = stepNumber === steps.length;
              return (
                <li key={label} className="flex items-center gap-1.5">
                  {index > 0 && (
                    <span aria-hidden="true" className="px-0.5 text-ink-soft/50">
                      ›
                    </span>
                  )}
                  <span
                    className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 ${
                      isCurrent ? 'bg-accent-soft text-accent-deep' : 'text-ink-soft'
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                        isCurrent ? 'bg-accent text-white' : 'bg-night text-white'
                      }`}
                    >
                      {stepNumber}
                    </span>
                    <span className={isCurrent ? 'font-bold' : ''}>{label}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap items-center gap-2">
            {estimate.is_mock && (
              <SampleDataBadge text={t('results.mockBadge')} variant="contrast" />
            )}
            <Link to="/app/projects" className="btn-ghost h-10 px-4">
              {t('results.savedProjects')}
            </Link>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfStatus === 'loading'}
              aria-busy={pdfStatus === 'loading'}
              className="btn-primary h-10 px-5"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>
                {pdfStatus === 'loading' ? t('results.generating') : t('results.download')}
              </span>
            </button>
          </div>
        </motion.div>

        {pdfStatus === 'error' && (
          <div
            role="alert"
            className="rounded-xl border border-error/25 bg-error/5 px-5 py-4 text-sm text-ink"
          >
            <strong className="block font-bold text-error">{t('results.pdfError.title')}</strong>
            <p className="mt-1 leading-6">{pdfError}</p>
            <p className="mt-1 leading-6 text-ink-soft">{t('results.pdfError.body')}</p>
          </div>
        )}

        {/* Mock warning: only when the API says is_mock is true */}
        {estimate.is_mock && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-ochre/40 bg-ochre/10 px-5 py-4 text-sm text-ink"
          >
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-ochre" aria-hidden="true" />
            <p className="leading-6">
              <strong className="uppercase tracking-wide">{t('results.mockWarning.title')}</strong>{' '}
              {t('results.mockWarning.body')}
            </p>
          </div>
        )}

        {/* Title block */}
        <motion.header variants={itemVariants} className="max-w-3xl space-y-3 pt-2">
          <p className="eyebrow text-accent">
            {projectName
              ? t('results.projectEstimateKicker', {
                  project: projectName.toUpperCase(),
                  id: shortId(estimate.id),
                })
              : t('results.estimateKicker', { id: shortId(estimate.id) })}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.03] tracking-[-0.055em] text-ink sm:text-5xl">
            {t('results.title')}
          </h1>
          <p className="text-sm leading-6 text-ink-soft">{subtitle}</p>
        </motion.header>

        {/* KPI cards */}
        <motion.section
          variants={itemVariants}
          aria-label={t('results.kpi.indicative')}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="relative overflow-hidden rounded-2xl bg-night p-6 text-white shadow-lift">
            <div className="flex items-start justify-between gap-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">
                {t('results.kpi.indicative')}
              </p>
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-white/10 text-white">
                <Wallet className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-[28px] font-extrabold leading-none tracking-[-0.05em] sm:text-[32px]">
              {formatINR(totalCost)}
            </p>
            <p className="mt-3 text-xs leading-5 text-white/60">
              {t('results.kpi.confidence', {
                label: estimate.confidence.label,
                reason: estimate.confidence.reason,
              })}
            </p>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs font-semibold text-[#9FB6FF]">
              {t('results.kpi.planningRange', {
                low: formatINR(estimate.total.p10),
                high: formatINR(estimate.total.p90),
              })}
            </p>
          </div>

          <div className="surface-card-interactive p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="eyebrow">{t('results.inputs.quality')}</p>
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-accent-soft text-accent">
                <Layers className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-[-0.04em] text-ink">
              {translateQuality(t, estimate.inputs.quality_tier)}
            </p>
            <p className="mt-3 text-xs leading-5 text-ink-soft">
              {t('results.inputs.construction')}:{' '}
              <span className="font-semibold text-ink">
                {translateConstruction(t, estimate.inputs.construction_type)}
              </span>
            </p>
          </div>

          <div className="surface-card-interactive p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="eyebrow">{t('results.kpi.totalBuiltUp')}</p>
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-accent-soft text-accent">
                <Ruler className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-[-0.04em] text-ink">
              {formatNumber(areaSqFt)}{' '}
              <span className="text-sm font-semibold text-ink-soft">{t('common.sqFt')}</span>
            </p>
            <p className="mt-3 text-xs leading-5 text-ink-soft">
              {t('results.kpi.builtUpMeta', {
                count: floors,
                construction: translateConstruction(t, estimate.inputs.construction_type),
              })}
            </p>
          </div>

          <div className="surface-card-interactive p-6">
            <div className="flex items-start justify-between gap-4">
              <p className="eyebrow">{t('results.kpi.planningRate')}</p>
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-accent-soft text-accent">
                <TrendingUp className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-[-0.04em] text-ink">
              ₹{formatNumber(ratePerSqFt)}{' '}
              <span className="text-sm font-semibold text-ink-soft">
                {t('results.kpi.perSqFt')}
              </span>
            </p>
            <p className="mt-3 text-xs leading-5 text-ink-soft">{t('results.kpi.rangeNote')}</p>
          </div>
        </motion.section>

        {/* Breakdown: donut + accessible table in one surface */}
        <motion.section
          variants={itemVariants}
          className="surface-card overflow-hidden"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line-soft px-6 py-5">
            <h2 className="section-title">{t('results.breakdown.title')}</h2>
            <span className="text-[11px] font-semibold text-ink-soft">
              {t('results.breakdown.meta', {
                count: estimate.breakdown.length,
                share: shareTotal,
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr]">
            <div className="flex items-center justify-center border-b border-line-soft bg-paper-deep/35 px-6 py-8 lg:border-b-0 lg:border-r">
              {estimate.breakdown.length > 0 ? (
                <BudgetDonut breakdown={estimate.breakdown} total={totalCost} t={t} />
              ) : (
                <p className="max-w-[16rem] text-center text-xs leading-5 text-ink-soft">
                  {t('results.breakdown.note')}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{t('results.breakdown.title')}</caption>
                <thead>
                  <tr className="border-b border-line-soft text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                    <th scope="col" className="px-6 py-3 font-bold">
                      {t('results.breakdown.costCategory')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-center font-bold">
                      {t('results.breakdown.share')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right font-bold">
                      {t('results.breakdown.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {estimate.breakdown.map((category, index) => (
                    <tr
                      key={category.category}
                      className="transition-colors duration-200 hover:bg-paper-deep/40"
                    >
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-2.5">
                          <span
                            data-testid="category-dot"
                            className="h-2 w-2 flex-none rounded-full"
                            style={{ backgroundColor: getCategoryColor(category.category, index) }}
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-ink">
                            {translateCategory(t, category.category)}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-ink-soft">
                        {category.share_pct}%
                      </td>
                      <td className="px-6 py-3 text-right text-[13px] font-bold text-ink">
                        {formatINR(category.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-line bg-paper-deep/60">
                    <td className="px-6 py-4 font-bold text-ink">
                      {t('results.breakdown.total')}
                    </td>
                    <td className="px-4 py-4 text-center text-xs font-bold text-ink-soft">
                      {shareTotal}%
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-extrabold text-accent">
                      {formatINR(totalCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="border-t border-line-soft px-6 py-3 text-[11px] leading-5 text-ink-soft">
            {t('results.breakdown.note')}
          </p>
        </motion.section>

        {/* Materials + estimate metadata */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
        >
          <div className="space-y-5 lg:col-span-8">
            <section className="surface-card overflow-hidden">
              <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="section-title">{t('results.materials.title')}</h2>
                <Link
                  to="/materials"
                  className="inline-flex items-center gap-1.5 self-start rounded text-xs font-bold text-accent hover:underline focus-ring sm:self-auto"
                >
                  <span>{t('results.materials.openGuide')}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>

              {estimate.materials.length > 0 ? (
                <div className="divide-y divide-line-soft border-t border-line-soft">
                  {estimate.materials.map((material) => (
                    <section key={material.category}>
                      <div className="space-y-1 px-6 py-4">
                        <h3 className="break-words text-sm font-bold text-ink">
                          {translateMaterialCategory(t, material.category)}
                        </h3>
                        <p className="break-words text-sm leading-6 text-ink-soft">
                          {material.reason}
                        </p>
                      </div>
                      <MaterialComparison
                        label={t('results.materials.comparisonLabel', {
                          category: translateMaterialCategory(t, material.category),
                        })}
                        primary={material.primary}
                        alternative={material.alternative}
                      />
                    </section>
                  ))}
                </div>
              ) : (
                <p className="border-t border-line-soft px-6 py-4 text-sm leading-6 text-ink-soft">
                  {t('results.materials.none')}
                </p>
              )}

              <p className="border-t border-line-soft bg-paper-deep/40 px-6 py-3 text-[11px] leading-5 text-ink-soft">
                {t('results.materials.disclaimer')}
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-paper-deep/60 px-6 py-5 text-[11px] leading-6 text-ink-soft">
              <strong className="font-bold text-ink">{t('results.serviceNote')}</strong>{' '}
              {estimate.disclaimer}
            </section>
          </div>

          <div className="space-y-5 lg:col-span-4">
            <section className="surface-card p-6">
              <h2 className="section-title">{t('results.inputs.title')}</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                {inputRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-3 border-b border-line-soft pb-2 last:border-0 last:pb-0"
                  >
                    <dt className="text-ink-soft">{label}</dt>
                    <dd className="text-right font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 space-y-1 border-t border-line-soft pt-3 text-[10px] text-ink-soft">
                <div>{t('results.inputs.prepared', { date: formatDateTime(estimate.created_at) })}</div>
                <div>
                  {t('results.inputs.model', {
                    version: estimate.model.version,
                    dataVersion: estimate.model.data_version,
                  })}
                </div>
              </div>
            </section>

            {estimate.drivers.length > 0 && (
              <section className="surface-card p-6">
                <h2 className="section-title">{t('results.drivers.title')}</h2>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {estimate.drivers.map((driver) => (
                    <div
                      key={driver.label}
                      className="flex justify-between gap-3 border-b border-line-soft pb-2 last:border-0 last:pb-0"
                    >
                      <dt className="text-ink-soft">{driver.label}</dt>
                      <dd className="text-right font-bold text-accent">{driver.impact_pct}%</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className="surface-card p-6">
              <h2 className="section-title">{t('results.notIncluded.title')}</h2>
              <ul className="mt-4 list-disc space-y-2 pl-4 text-sm leading-6 text-ink-soft">
                <li>{t('results.notIncluded.item1')}</li>
                <li>{t('results.notIncluded.item2')}</li>
                <li>{t('results.notIncluded.item3')}</li>
              </ul>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

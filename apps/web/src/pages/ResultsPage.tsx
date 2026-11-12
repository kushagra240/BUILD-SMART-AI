import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

// Colour mapping for the 9 v1 cost categories. Keys are the English contract
// values: only the display text is translated, never the stored/API key.
const CATEGORY_CHART_COLORS: Record<string, string> = {
  Foundation: '#6B4F3A',
  Structure: '#1F4D45',
  Masonry: '#B4472B',
  Roofing: '#8A6FA0',
  Flooring: '#D9A441',
  Plumbing: '#4F86A6',
  Electrical: '#9BB05A',
  Finishing: '#D88C9A',
  Labour: '#3A3F3C',
};

function getCategoryColor(name: string): string {
  return CATEGORY_CHART_COLORS[name] ?? '#1F4D45';
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
 * new backend field appears without a frontend change. Key captions come from
 * the API (technical field names) and are humanised, not translated.
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
      <p className="border-t border-ink/10 p-4 text-sm text-ink-soft">
        {t('results.materials.noSpec')}
      </p>
    );
  }

  const renderValue = (source: Record<string, string | number>, key: string) => {
    const value = source[key];
    if (value === undefined || value === '') {
      return <span className="italic text-ink-soft">{t('common.notProvided')}</span>;
    }
    return typeof value === 'number' ? formatNumber(value) : value;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-y border-ink/10 bg-paper-deep/50 text-left">
            <th
              scope="col"
              className="w-[30%] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft"
            >
              {t('results.materials.specification')}
            </th>
            <th
              scope="col"
              className="w-[35%] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft"
            >
              {t('results.materials.primary')}
            </th>
            <th
              scope="col"
              className="w-[35%] px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft"
            >
              {t('results.materials.alternative')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {keys.map((key) => (
            <tr key={key} className="align-top">
              <th
                scope="row"
                className="break-words px-4 py-2.5 text-left font-medium text-ink-soft"
              >
                {titleCase(key)}
              </th>
              <td className="break-words px-4 py-2.5 text-ink">
                {renderValue(primary, key)}
              </td>
              <td className="break-words px-4 py-2.5 text-ink">
                {renderValue(alternative, key)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = (location.state ?? null) as ResultsLocationState | null;

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

  if (status === 'redirect') {
    return <Navigate to="/app" replace />;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-paper px-4">
        <div className="w-full max-w-2xl">
          <LoadingState label={t('results.loading')} />
        </div>
      </div>
    );
  }

  if (status === 'error' || !estimate) {
    return (
      <div className="min-h-screen bg-paper text-ink px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-5">
          <ErrorState
            message={error ?? t('results.errors.load')}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/app" className="text-brick hover:underline focus-ring rounded">
              {t('results.backDashboard')}
            </Link>
            <Link to="/app/new" className="text-brick hover:underline focus-ring rounded">
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

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Step Indicator Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-forest text-paper font-semibold">1</span>
            <span className="text-ink">{t('results.steps.projectSite')}</span>
            <span className="text-ink-soft">›</span>
            <span className="px-2 py-0.5 rounded bg-forest text-paper font-semibold">2</span>
            <span className="text-ink">{t('results.steps.preferences')}</span>
            <span className="text-ink-soft">›</span>
            <span className="px-2 py-0.5 rounded bg-brick text-paper font-semibold">3</span>
            <span className="font-semibold text-ink">{t('results.steps.estimate')}</span>
          </div>

          <div className="flex items-center gap-2">
            {estimate.is_mock && (
              <SampleDataBadge text={t('results.mockBadge')} variant="contrast" />
            )}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfStatus === 'loading'}
              aria-busy={pdfStatus === 'loading'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-forest hover:bg-forest-hover disabled:opacity-60 disabled:cursor-not-allowed text-paper text-xs font-medium transition-colors focus-ring"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {pdfStatus === 'loading' ? t('results.generating') : t('results.download')}
              </span>
            </button>
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
            >
              <span>{t('results.savedProjects')}</span>
            </Link>
          </div>
        </div>

        {pdfStatus === 'error' && (
          <div
            role="alert"
            className="rounded-lg border border-brick/40 bg-brick-light px-4 py-3 text-xs text-ink space-y-1"
          >
            <strong className="text-brick">{t('results.pdfError.title')}</strong>
            <p className="leading-relaxed">{pdfError}</p>
            <p className="text-ink-soft leading-relaxed">{t('results.pdfError.body')}</p>
          </div>
        )}

        {/* Mock warning: only when the API says is_mock is true */}
        {estimate.is_mock && (
          <div
            role="status"
            className="rounded-lg border border-ochre/40 bg-ochre/10 px-4 py-3 text-xs text-ink flex items-start gap-2"
          >
            <Info className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="uppercase tracking-wide">{t('results.mockWarning.title')}</strong>{' '}
              {t('results.mockWarning.body')}
            </p>
          </div>
        )}

        {/* Title Header */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-soft">
            {projectName
              ? t('results.projectEstimateKicker', {
                  project: projectName.toUpperCase(),
                  id: shortId(estimate.id),
                })
              : t('results.estimateKicker', { id: shortId(estimate.id) })}
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            {t('results.title')}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft font-sans">{subtitle}</p>
        </div>

        {/* Top KPI Box */}
        <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Indicative Total */}
          <div className="md:col-span-5 space-y-1.5 md:border-r border-ink/10 md:pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-clay text-ink-soft border border-ink/14 font-semibold">
                {t('results.kpi.indicative')}
              </span>
            </div>
            <div className="font-headline text-3xl sm:text-5xl font-bold text-brick tracking-tight">
              {formatINR(totalCost)}
            </div>
            <p className="text-xs text-ink-soft font-sans">
              {t('results.kpi.confidence', {
                label: estimate.confidence.label,
                reason: estimate.confidence.reason,
              })}
            </p>
          </div>

          {/* Planning Rate & Band */}
          <div className="md:col-span-4 space-y-1 md:border-r border-ink/10 md:pr-6">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              {t('results.kpi.planningRate')}
            </div>
            <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
              ₹{formatNumber(ratePerSqFt)}{' '}
              <span className="text-sm font-sans font-normal text-ink-soft">
                {t('results.kpi.perSqFt')}
              </span>
            </div>
            <div className="text-xs text-forest font-semibold pt-0.5">
              {t('results.kpi.planningRange', {
                low: formatINR(estimate.total.p10),
                high: formatINR(estimate.total.p90),
              })}
            </div>
            <p className="text-[11px] text-ink-soft leading-tight">{t('results.kpi.rangeNote')}</p>
          </div>

          {/* Built-up Area */}
          <div className="md:col-span-3 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              {t('results.kpi.totalBuiltUp')}
            </div>
            <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
              {formatNumber(areaSqFt)}{' '}
              <span className="text-sm font-sans font-normal text-ink-soft">
                {t('common.sqFt')}
              </span>
            </div>
            <p className="text-[11px] text-ink-soft leading-tight">
              {t('results.kpi.builtUpMeta', {
                count: floors,
                construction: translateConstruction(t, estimate.inputs.construction_type),
              })}
            </p>
          </div>
        </div>

        {/* Main Grid: Breakdown on left, inputs on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Where the budget goes */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-baseline justify-between border-b border-ink/14 pb-2">
              <h2 className="font-headline text-xl font-bold text-ink">
                {t('results.breakdown.title')}
              </h2>
              <span className="text-xs font-mono text-ink-soft">
                {t('results.breakdown.meta', {
                  count: estimate.breakdown.length,
                  share: shareTotal,
                })}
              </span>
            </div>

            {/* Segmented Stacked Bar Chart */}
            <div className="space-y-1.5">
              <div
                className="w-full h-5 rounded overflow-hidden flex border border-ink/14 shadow-inner"
                role="img"
                aria-label={t('results.breakdown.chartAria')}
              >
                {estimate.breakdown.map((item) => (
                  <div
                    key={item.category}
                    style={{
                      width: `${item.share_pct}%`,
                      backgroundColor: getCategoryColor(item.category),
                    }}
                    title={`${translateCategory(t, item.category)}: ${item.share_pct}% (${formatINR(
                      item.amount
                    )})`}
                    className="h-full transition-opacity hover:opacity-90"
                  />
                ))}
              </div>

              {/* Chart Legend Mini-bar */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-ink-soft pt-1">
                {estimate.breakdown.slice(0, 5).map((item) => (
                  <div key={item.category} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    />
                    <span>
                      {translateCategory(t, item.category).split(' ')[0]} ({item.share_pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories Table */}
            <div className="border border-ink/14 rounded-lg overflow-hidden bg-paper">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-deep/70 text-ink-soft font-mono uppercase text-[10px] tracking-wider border-b border-ink/14">
                  <tr>
                    <th scope="col" className="py-2.5 px-4 font-semibold">
                      {t('results.breakdown.costCategory')}
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-center font-semibold">
                      {t('results.breakdown.share')}
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-right font-semibold">
                      {t('results.breakdown.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 font-sans">
                  {estimate.breakdown.map((category) => (
                    <tr key={category.category} className="hover:bg-paper-deep/30 transition-colors">
                      <td className="py-2.5 px-4 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(category.category) }}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-ink">
                          {translateCategory(t, category.category)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono text-ink-soft">
                        {category.share_pct}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-ink">
                        {formatINR(category.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-clay/40 font-bold border-t-2 border-ink/20">
                    <td className="py-3 px-4 text-ink font-sans text-sm">
                      {t('results.breakdown.total')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-ink">{shareTotal}%</td>
                    <td className="py-3 px-4 text-right font-mono text-brick text-sm">
                      {formatINR(totalCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-ink-soft leading-relaxed font-sans">
              {t('results.breakdown.note')}
            </p>

            {/* Material recommendations from the API */}
            <div className="overflow-hidden rounded-lg border border-ink/14 bg-paper-deep/60">
              <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-headline text-base font-bold text-ink">
                  {t('results.materials.title')}
                </h3>
                <Link
                  to="/materials"
                  className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-brick hover:underline focus-ring rounded sm:self-auto"
                >
                  <span>{t('results.materials.openGuide')}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>

              {estimate.materials.length > 0 ? (
                <div className="divide-y divide-ink/14 border-t border-ink/14">
                  {estimate.materials.map((material) => (
                    <section key={material.category} className="bg-paper">
                      <div className="space-y-1 p-4">
                        <h4 className="break-words text-sm font-semibold text-ink">
                          {translateMaterialCategory(t, material.category)}
                        </h4>
                        <p className="break-words text-sm leading-relaxed text-ink-soft">
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
                <p className="border-t border-ink/14 p-4 text-sm text-ink-soft">
                  {t('results.materials.none')}
                </p>
              )}

              <p className="border-t border-ink/14 bg-paper-deep/40 px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
                {t('results.materials.disclaimer')}
              </p>
            </div>

            {/* Service disclaimer */}
            <div className="bg-clay/40 border border-ink/14 rounded-lg p-4 text-[11px] text-ink-soft leading-relaxed">
              <strong className="text-ink font-sans">{t('results.serviceNote')}</strong>{' '}
              {estimate.disclaimer}
            </div>
          </div>

          {/* Right Column: contract inputs */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
              <h3 className="font-headline font-bold text-base text-ink">
                {t('results.inputs.title')}
              </h3>
              <div className="space-y-2 text-xs font-sans">
                {inputRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-3 border-b border-ink/10 pb-1.5"
                  >
                    <span className="text-ink-soft">{label}</span>
                    <span className="font-medium text-ink text-right">{value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-ink/10 text-[10px] font-mono text-ink-soft space-y-1">
                <div>
                  {t('results.inputs.prepared', { date: formatDateTime(estimate.created_at) })}
                </div>
                <div>
                  {t('results.inputs.model', {
                    version: estimate.model.version,
                    dataVersion: estimate.model.data_version,
                  })}
                </div>
              </div>
            </div>

            {estimate.drivers.length > 0 && (
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
                <h3 className="font-headline font-bold text-base text-ink">
                  {t('results.drivers.title')}
                </h3>
                <div className="space-y-2 text-xs font-sans">
                  {estimate.drivers.map((driver) => (
                    <div
                      key={driver.label}
                      className="flex justify-between gap-3 border-b border-ink/10 pb-1.5"
                    >
                      <span className="text-ink-soft">{driver.label}</span>
                      <span className="font-medium text-ink text-right">
                        {driver.impact_pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-2.5">
              <h3 className="font-headline font-bold text-base text-ink">
                {t('results.notIncluded.title')}
              </h3>
              <ul className="text-xs text-ink-soft space-y-2 list-disc list-inside font-sans">
                <li>{t('results.notIncluded.item1')}</li>
                <li>{t('results.notIncluded.item2')}</li>
                <li>{t('results.notIncluded.item3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

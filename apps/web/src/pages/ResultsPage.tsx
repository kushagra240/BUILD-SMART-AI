import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Download, Info } from 'lucide-react';
import { apiClient, type EstimateResponse } from '../services/apiClient';
import { apiErrorMessage } from '../lib/errorMessage';
import { formatDateTime, formatINR, formatNumber } from '../lib/formatters';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ErrorState, LoadingState } from '../components/common/AsyncState';

// Colour mapping for the 9 v1 cost categories. Unknown categories fall back.
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
function formatBudget(budget: EstimateResponse['budget']): string {
  if (budget.status === 'not_provided') {
    return 'Not provided';
  }
  if (budget.gap_inr <= 0) {
    return budget.status === 'within' ? 'Within budget' : titleCase(budget.status);
  }
  const amount = formatINR(budget.gap_inr);
  if (budget.status === 'within') {
    return `Above estimate by ${amount}`;
  }
  return `${titleCase(budget.status)} · short by ${amount}`;
}

type ResultsLocationState = {
  estimate?: unknown;
  projectName?: string;
  locality?: string;
};

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

/** Render a contract dictionary (`primary`/`alternative`) without inventing keys. */
function DictionaryEntries({ data }: { data: Record<string, string | number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return null;
  }
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between gap-2 border-b border-ink/10 py-1">
          <dt className="text-ink-soft">{titleCase(key)}</dt>
          <dd className="font-medium text-ink text-right">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ResultsPage() {
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
        setError(apiErrorMessage(cause, 'Could not load this estimate'));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [estimate, id, reloadKey]);

  if (status === 'redirect') {
    return <Navigate to="/app" replace />;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-paper px-4">
        <div className="w-full max-w-2xl">
          <LoadingState label="Loading estimate…" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !estimate) {
    return (
      <div className="min-h-screen bg-paper text-ink px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-5">
          <ErrorState
            message={error ?? 'Could not load this estimate'}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <Link to="/app" className="text-brick hover:underline focus-ring rounded">
              Back to dashboard
            </Link>
            <Link to="/app/new" className="text-brick hover:underline focus-ring rounded">
              Start a new estimate
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
    floors ? `G+${Math.max(0, floors - 1)} · ${floors} floor${floors === 1 ? '' : 's'}` : null,
    `${formatNumber(areaSqFt)} sq ft total built-up`,
    `${titleCase(estimate.inputs.quality_tier)} quality`,
    `${titleCase(estimate.inputs.zone_id)} zone`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Step Indicator Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-forest text-paper font-semibold">1</span>
            <span className="text-ink">Project & site</span>
            <span className="text-ink-soft">›</span>
            <span className="px-2 py-0.5 rounded bg-forest text-paper font-semibold">2</span>
            <span className="text-ink">Preferences</span>
            <span className="text-ink-soft">›</span>
            <span className="px-2 py-0.5 rounded bg-brick text-paper font-semibold">3</span>
            <span className="font-semibold text-ink">Your estimate</span>
          </div>

          <div className="flex items-center gap-2">
            {estimate.is_mock && <SampleDataBadge text="Mock / stub data" variant="contrast" />}
            <Link
              to="/app/projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
            >
              <span>Saved projects</span>
            </Link>
            <Link
              to="/pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-paper border border-ink/14 hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
            >
              <Download className="w-3.5 h-3.5 text-ink-soft" />
              <span>PDF preview</span>
            </Link>
          </div>
        </div>

        {/* Mock warning: only when the API says is_mock is true */}
        {estimate.is_mock && (
          <div
            role="status"
            className="rounded-lg border border-ochre/40 bg-ochre/10 px-4 py-3 text-xs text-ink flex items-start gap-2"
          >
            <Info className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="uppercase tracking-wide">Mock / stub data:</strong> These figures
              come from the development stub engine. They are placeholders, not real sourced
              rates, and must not be used for budgeting or contractor discussions.
            </p>
          </div>
        )}

        {/* Title Header */}
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-soft">
            {projectName ? `${projectName.toUpperCase()} · ` : ''}ESTIMATE {shortId(estimate.id)}
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
            Your home, in numbers.
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft font-sans">{subtitle}</p>
        </div>

        {/* Top KPI Box */}
        <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Main Indicative Total */}
          <div className="md:col-span-5 space-y-1.5 md:border-r border-ink/10 md:pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-clay text-ink-soft border border-ink/14 font-semibold">
                INDICATIVE · NOT A QUOTE
              </span>
            </div>
            <div className="font-headline text-3xl sm:text-5xl font-bold text-brick tracking-tight">
              {formatINR(totalCost)}
            </div>
            <p className="text-xs text-ink-soft font-sans">
              Confidence: <strong className="text-ink">{estimate.confidence.label}</strong> ·{' '}
              {estimate.confidence.reason}
            </p>
          </div>

          {/* Planning Rate & Band */}
          <div className="md:col-span-4 space-y-1 md:border-r border-ink/10 md:pr-6">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              PLANNING RATE
            </div>
            <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
              ₹{formatNumber(ratePerSqFt)}{' '}
              <span className="text-sm font-sans font-normal text-ink-soft">/ sq ft</span>
            </div>
            <div className="text-xs text-forest font-semibold pt-0.5">
              Planning range: {formatINR(estimate.total.p10)} – {formatINR(estimate.total.p90)}
            </div>
            <p className="text-[11px] text-ink-soft leading-tight">
              Range returned by the estimate service. A planning band, not a guaranteed price.
            </p>
          </div>

          {/* Built-up Area */}
          <div className="md:col-span-3 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
              TOTAL BUILT-UP AREA
            </div>
            <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
              {formatNumber(areaSqFt)}{' '}
              <span className="text-sm font-sans font-normal text-ink-soft">sq ft</span>
            </div>
            <p className="text-[11px] text-ink-soft leading-tight">
              {floors} floor{floors === 1 ? '' : 's'} · {titleCase(estimate.inputs.construction_type)}
            </p>
          </div>
        </div>

        {/* Main Grid: Breakdown on left, inputs on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Where the budget goes */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-baseline justify-between border-b border-ink/14 pb-2">
              <h2 className="font-headline text-xl font-bold text-ink">Where the budget goes</h2>
              <span className="text-xs font-mono text-ink-soft">
                {estimate.breakdown.length} categories · {shareTotal}% allocated
              </span>
            </div>

            {/* Segmented Stacked Bar Chart */}
            <div className="space-y-1.5">
              <div
                className="w-full h-5 rounded overflow-hidden flex border border-ink/14 shadow-inner"
                role="img"
                aria-label="Cost allocation chart across estimate categories"
              >
                {estimate.breakdown.map((item) => (
                  <div
                    key={item.category}
                    style={{
                      width: `${item.share_pct}%`,
                      backgroundColor: getCategoryColor(item.category),
                    }}
                    title={`${item.category}: ${item.share_pct}% (${formatINR(item.amount)})`}
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
                      {item.category.split(' ')[0]} ({item.share_pct}%)
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
                      Cost Category
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-center font-semibold">
                      Share
                    </th>
                    <th scope="col" className="py-2.5 px-4 text-right font-semibold">
                      Amount
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
                        <span className="font-medium text-ink">{category.category}</span>
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
                    <td className="py-3 px-4 text-ink font-sans text-sm">Total indicative estimate</td>
                    <td className="py-3 px-4 text-center font-mono text-ink">{shareTotal}%</td>
                    <td className="py-3 px-4 text-right font-mono text-brick text-sm">
                      {formatINR(totalCost)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-ink-soft leading-relaxed font-sans">
              Category amounts are returned by the estimate service and may include materials and
              labour allowances. They are not itemised contractor rates.
            </p>

            {/* Material recommendations from the API */}
            <div className="bg-paper-deep/60 border border-ink/14 rounded-lg p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-headline font-bold text-base text-ink">
                  Material recommendations
                </h3>
                <Link
                  to="/materials"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brick hover:underline focus-ring rounded"
                >
                  <span>Open the material guide</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>

              {estimate.materials.length > 0 ? (
                <div className="space-y-4">
                  {estimate.materials.map((material) => (
                    <div
                      key={material.category}
                      className="border-t border-ink/10 pt-3 first:border-t-0 first:pt-0 space-y-2"
                    >
                      <div className="text-sm font-semibold text-ink">
                        {titleCase(material.category)}
                      </div>
                      <p className="text-xs text-ink-soft">{material.reason}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-soft">
                            Primary
                          </div>
                          <DictionaryEntries data={material.primary} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-soft">
                            Alternative
                          </div>
                          <DictionaryEntries data={material.alternative} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-soft">
                  No material recommendations were returned for this estimate.
                </p>
              )}
            </div>

            {/* Service disclaimer */}
            <div className="bg-clay/40 border border-ink/14 rounded-lg p-4 text-[11px] text-ink-soft leading-relaxed">
              <strong className="text-ink font-sans">Estimate service note:</strong>{' '}
              {estimate.disclaimer}
            </div>
          </div>

          {/* Right Column: contract inputs */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
              <h3 className="font-headline font-bold text-base text-ink">Estimate inputs</h3>
              <div className="space-y-2 text-xs font-sans">
                {[
                  ['Construction', titleCase(estimate.inputs.construction_type)],
                  ['Quality tier', titleCase(estimate.inputs.quality_tier)],
                  ['Zone', titleCase(estimate.inputs.zone_id)],
                  ['Floors', String(estimate.inputs.floors)],
                  ['Bedrooms', String(estimate.inputs.bedrooms)],
                  ['Bathrooms', String(estimate.inputs.bathrooms)],
                  [
                    'Plot area',
                    estimate.inputs.plot_area_sqft
                      ? `${formatNumber(estimate.inputs.plot_area_sqft)} sq ft`
                      : 'Not provided',
                  ],
                  ['Budget', formatBudget(estimate.budget)],
                ].map(([label, value]) => (
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
                <div>Prepared {formatDateTime(estimate.created_at)}</div>
                <div>
                  Model {estimate.model.version} · Data {estimate.model.data_version}
                </div>
              </div>
            </div>

            {estimate.drivers.length > 0 && (
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
                <h3 className="font-headline font-bold text-base text-ink">Cost drivers</h3>
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
              <h3 className="font-headline font-bold text-base text-ink">Not included</h3>
              <ul className="text-xs text-ink-soft space-y-2 list-disc list-inside font-sans">
                <li>
                  Land cost, approvals and statutory fees; architect, engineer and professional fees.
                </li>
                <li>Compound wall, landscaping and other external site works.</li>
                <li>
                  Furniture, modular kitchen, lift, solar systems and major utility connections are
                  also excluded.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

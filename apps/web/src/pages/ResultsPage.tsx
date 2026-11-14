import { useContext, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { apiClient, type EstimateResponse } from '../services/apiClient';
import { categoryChartColor } from '../domain/estimateCategories';
import { apiErrorMessage } from '../lib/errorMessage';
import { formatDateTime, formatINR, formatNumber } from '../lib/formatters';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ErrorState, LoadingState } from '../components/common/AsyncState';
import { AuthContext } from '../auth/context';
import { Glyph, type GlyphName } from '../components/common/Glyph';
import buildSmartLogo from '../assets/buildsmart-logo.png';
import {
  translateCategory,
  translateMaterialCategory,
  translateQuality,
  translateZone,
} from '../i18n/labels';

function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

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
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

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
    typeof total?.p50 === 'number' &&
    typeof inputs === 'object' &&
    typeof inputs?.built_up_area_sqft === 'number'
  );
}

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

export function ResultsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state ?? null) as ResultsLocationState | null;
  const reduceMotion = useReducedMotion();
  const auth = useContext(AuthContext);

  const [activeNav, setActiveNav] = useState('Estimate');
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
    if (estimate && estimate.id === id) {
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

  const handleDownloadCsv = () => {
    if (!estimate) return;
    const header = 'Category,Amount (INR),Share (%)\n';
    const rows = estimate.breakdown
      .map((b) => `"${b.category}",${b.amount},${b.share_pct}`)
      .join('\n');
    const totalRow = `\n"Total",${estimate.total.p50},100`;
    saveBlob(new Blob([header + rows + totalRow], { type: 'text/csv' }), 'buildsmart-estimate-breakdown.csv');
  };

  const handleLogout = async () => {
    if (auth?.logout) {
      await auth.logout();
    }
    navigate('/login', { replace: true });
  };

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
    },
  };

  const itemVariants: Variants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        },
      };

  if (status === 'redirect') {
    return <Navigate to="/app" replace />;
  }

  if (status === 'loading') {
    return (
      <main className="results-page">
        <section className="results-main py-20 text-center">
          <LoadingState label={t('results.loading')} />
        </section>
      </main>
    );
  }

  if (status === 'error' || !estimate) {
    return (
      <main className="results-page">
        <section className="results-main p-8">
          <div className="mx-auto max-w-2xl space-y-5">
            <ErrorState
              message={error ?? t('results.errors.load')}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Link to="/app" className="rounded font-semibold text-accent hover:underline">
                Back to dashboard
              </Link>
              <Link to="/app/new" className="rounded font-semibold text-accent hover:underline">
                {t('results.startNewEstimate')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const projectName = locationState?.projectName || 'Deshmukh residence';
  const locality = locationState?.locality || 'Baner, Pune';
  const areaSqFt = estimate.inputs.built_up_area_sqft;
  const totalCost = estimate.total.p50;
  const ratePerSqFt = areaSqFt > 0 ? Math.round(totalCost / areaSqFt) : 0;
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

  const donutData = estimate.breakdown.map((item, index) => ({
    category: item.category,
    amount: item.amount,
    share_pct: item.share_pct,
    fill: categoryChartColor(item.category, index),
  }));

  const largestShare = Math.max(0, ...donutData.map((item) => item.share_pct));
  const topCategories = [...donutData].sort((a, b) => b.amount - a.amount).slice(0, 3);

  return (
    <main className="results-page">
      <aside className="results-sidebar">
        <Link to="/" className="results-logo" aria-label="BuildSmart home">
          <img src={buildSmartLogo} alt="BuildSmart AI" />
        </Link>
        <nav>
          {[
            ['Projects', 'folder', '/app'],
            ['Estimate', 'chart', ''],
            ['Project details', 'home', '/app/new'],
            ['Settings', 'settings', '/materials'],
          ].map(([label, icon, route]) => (
            <button
              className={activeNav === label ? 'active' : ''}
              key={label}
              onClick={() => {
                setActiveNav(label);
                if (route) navigate(route);
              }}
            >
              <Glyph name={icon as GlyphName} size={17} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-project">
          <span>Active project</span>
          <strong>{projectName}</strong>
          <small>{locality}</small>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <Glyph name="logout" size={16} /> Log out
        </button>
      </aside>

      <section className="results-main">
        <header className="results-topbar">
          <button className="results-mobile-menu" aria-label="Open menu">
            <Glyph name="menu" />
          </button>
          <div>
            <span className="result-ready">
              <i /> Estimate ready
            </span>
            <span>{formatDateTime(estimate.created_at)}</span>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfStatus === 'loading'}
            aria-busy={pdfStatus === 'loading'}
          >
            <Glyph name="download" size={15} />{' '}
            {pdfStatus === 'loading' ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </header>

        <motion.div
          className="results-content"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {pdfError && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between rounded-xl border border-error/25 bg-error/5 px-5 py-3 text-xs text-error"
            >
              <div>
                <strong>PDF export failed: </strong>
                <span>{pdfError}</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="ml-4 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {estimate.is_mock && (
            <div
              role="status"
              className="mb-6 flex items-start gap-3 rounded-xl border border-ochre/40 bg-ochre/10 px-5 py-4 text-xs text-ink"
            >
              <p>
                <strong>{t('results.mockWarning.title')}:</strong> {t('results.mockWarning.body')}
              </p>
            </div>
          )}

          <motion.div variants={itemVariants} className="results-heading">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="app-eyebrow">
                  {projectName} · estimate
                </p>
                {estimate.is_mock && (
                  <SampleDataBadge text={t('results.mockBadge')} />
                )}
              </div>
              <h1>{t('results.title')}</h1>
              <p>{subtitle}</p>
            </div>
            <Link to="/app/new" className="text-xs font-semibold text-accent hover:underline">
              Edit project details
            </Link>
          </motion.div>

          <motion.section variants={itemVariants} className="result-hero">
            <div>
              <p>Total estimated construction cost</p>
              <strong className="mono">{formatINR(estimate.total.p50)}</strong>
              <span>
                <i /> ₹{formatNumber(ratePerSqFt)} per sq ft
              </span>
            </div>
            <div className="result-hero-chart" aria-hidden="true">
              {[34, 48, 42, 61, 56, 75, 68, 88, 80, 100].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="result-confidence">
              <span>Planning confidence</span>
              <strong>{estimate.confidence.label}</strong>
              <div>
                <i />
              </div>
              <small>{estimate.confidence.reason}</small>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="result-kpis">
            <article>
              <span>
                <Glyph name="area" size={17} />
              </span>
              <div>
                <p>{t('results.kpi.totalBuiltUp') || 'Built-up area'}</p>
                <strong className="mono">{formatNumber(areaSqFt)} sq ft</strong>
              </div>
            </article>
            <article>
              <span>
                <Glyph name="check" size={17} />
              </span>
              <div>
                <p>{t('results.inputs.quality') || 'Quality tier'}</p>
                <strong>{translateQuality(t, estimate.inputs.quality_tier)}</strong>
              </div>
            </article>
            <article>
              <span>
                <Glyph name="chart" size={17} />
              </span>
              <div>
                <p>{t('results.kpi.planningRate') || 'Planning rate'}</p>
                <strong className="mono">₹{formatNumber(ratePerSqFt)}/sq ft</strong>
              </div>
            </article>
            <article>
              <span>
                <Glyph name="chart" size={17} />
              </span>
              <div>
                <p>Planning range</p>
                <strong className="mono">
                  {formatINR(estimate.total.p10)} – {formatINR(estimate.total.p90)}
                </strong>
              </div>
            </article>
          </motion.section>

          <motion.div variants={itemVariants} className="result-grid">
            <section className="result-panel breakdown-panel">
              <div className="result-panel-head">
                <div>
                  <p className="app-eyebrow">Cost composition</p>
                  <h2>{t('results.breakdown.title') || 'Budget breakdown'}</h2>
                </div>
              </div>
              <div className="result-donut-layout" data-testid="budget-donut">
                <div className="result-donut relative">
                  <ResponsiveContainer width="100%" height={220} initialDimension={{ width: 220, height: 220 }}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={65}
                        outerRadius={88}
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {donutData.map((entry) => (
                          <Cell
                            key={entry.category}
                            fill={entry.fill}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => formatINR(Number(val))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="pointer-events-none">
                    <small>Total</small>
                    <strong className="mono">{formatINR(estimate.total.p50)}</strong>
                  </span>
                </div>
                <div className="result-legend">
                  {donutData.map((item) => (
                    <div key={item.category}>
                      <i style={{ backgroundColor: item.fill }} />
                      <span>{translateCategory(t, item.category)}</span>
                      <strong className="mono">{formatINR(item.amount)}</strong>
                      <small>{item.share_pct}%</small>
                    </div>
                  ))}
                </div>
              </div>
              <p className="result-note">{t('results.breakdown.note')}</p>
            </section>

            <section className="result-panel insight-panel">
              <div className="result-panel-head">
                <div>
                  <p className="app-eyebrow">Planning insight</p>
                  <h2>Where the budget goes</h2>
                </div>
              </div>
              <div className="insight-bars">
                {topCategories.map((item) => (
                  <div key={item.category}>
                    <span>
                      {translateCategory(t, item.category)}{' '}
                      <strong className="mono">{formatINR(item.amount)}</strong>
                    </span>
                    <i>
                      <b
                        style={{
                          width: `${largestShare > 0 ? Math.round((item.share_pct / largestShare) * 100) : 0}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </i>
                  </div>
                ))}
              </div>
              <div className="insight-callout">
                <span>
                  <Glyph name="check" />
                </span>
                <p>
                  <strong>{t('results.budget.heading') || 'Balanced specification'}</strong>
                  {formatBudget(estimate.budget, t)}
                </p>
              </div>
            </section>
          </motion.div>

          <motion.section variants={itemVariants} className="result-panel cost-table-panel">
            <div className="result-panel-head">
              <div>
                <p className="app-eyebrow">Detailed allocation</p>
                <h2>Category cost breakdown</h2>
              </div>
              <button
                type="button"
                className="table-download"
                onClick={handleDownloadCsv}
              >
                <Glyph name="download" size={14} /> Download CSV
              </button>
            </div>
            <div className="cost-table">
              <div className="cost-table-head">
                <span>Category</span>
                <span>Estimated cost</span>
                <span>Share</span>
              </div>
              {estimate.breakdown.map((row, index) => (
                <div className="cost-table-row" key={row.category}>
                  <span className="flex items-center gap-2">
                    <i
                      data-testid="category-dot"
                      style={{
                        backgroundColor: categoryChartColor(row.category, index),
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <i>{String(index + 1).padStart(2, '0')}</i>
                    <strong>{translateCategory(t, row.category)}</strong>
                  </span>
                  <strong className="mono">{formatINR(row.amount)}</strong>
                  <span className="mono">{row.share_pct}%</span>
                </div>
              ))}
              <div className="cost-table-total">
                <span>Total estimated construction cost</span>
                <strong className="mono">{formatINR(estimate.total.p50)}</strong>
                <span>100%</span>
              </div>
            </div>
          </motion.section>

          {/* Material Recommendations Panel */}
          <motion.section variants={itemVariants} className="result-panel materials-panel p-6">
            <div className="result-panel-head mb-4">
              <div>
                <p className="app-eyebrow">Specification comparison</p>
                <h2>{t('results.materials.title')}</h2>
              </div>
              <Link to="/materials" className="text-xs font-semibold text-accent hover:underline">
                {t('results.materials.openGuide')} →
              </Link>
            </div>
            {estimate.materials.length > 0 ? (
              <div className="divide-y divide-line-soft">
                {estimate.materials.map((material) => (
                  <section key={material.category} className="py-4">
                    <div className="mb-3 space-y-1">
                      <h3 className="text-sm font-bold text-ink">
                        {translateMaterialCategory(t, material.category)}
                      </h3>
                      <p className="text-xs text-ink-soft">{material.reason}</p>
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
              <p className="py-6 text-center text-xs text-ink-soft">
                {t('results.materials.none')}
              </p>
            )}
          </motion.section>

          <p className="results-disclaimer">
            {estimate.disclaimer ||
              'Indicative planning estimate for Pune region. Final costs require detailed drawings, structural assessment, site verification, and contractor quotations.'}
          </p>
        </motion.div>
      </section>
    </main>
  );
}

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EstimateResponse } from '../types/estimate';
import { calculateEstimateMock } from '../services/mockApi';
import { formatINR, formatINRShorthand, formatNumber } from '../lib/formatters';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import {
  TrendingUp,
  ShieldAlert,
  Download,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Info,
  Table as TableIcon,
  PieChart as PieIcon,
  HelpCircle,
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<EstimateResponse | null>(location.state?.estimate || null);
  const [loading, setLoading] = useState<boolean>(!location.state?.estimate);
  const [showTableView, setShowTableView] = useState<boolean>(false);

  useEffect(() => {
    if (!estimate) {
      // Default fallback mock calculation if accessed directly
      calculateEstimateMock({
        built_up_area_sqft: 1800,
        floors: 2,
        bedrooms: 3,
        bathrooms: 3,
        zone_id: 'pune_west',
        quality_tier: 'standard',
        construction_type: 'rcc_framed',
        budget_inr: 3500000,
      }).then((res) => {
        setEstimate(res);
        setLoading(false);
      });
    }
  }, [estimate]);

  if (loading || !estimate) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Generating cost estimate & material breakdown (MOCK)...</p>
      </div>
    );
  }

  // Doughnut Chart Data Configuration
  const chartData = {
    labels: estimate.breakdown.map((b) => b.category),
    datasets: [
      {
        label: 'Cost (INR)',
        data: estimate.breakdown.map((b) => b.amount),
        backgroundColor: [
          '#d97706', // Amber 600
          '#0284c7', // Sky 600
          '#059669', // Emerald 600
          '#7c3aed', // Violet 600
          '#db2777', // Pink 600
          '#ea580c', // Orange 600
          '#4f46e5', // Indigo 600
          '#0891b2', // Cyan 600
          '#475569', // Slate 600
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: { family: 'Inter, system-ui', size: 12 },
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const val = context.raw ? Number(context.raw) : 0;
            return ` ${context.label}: ${formatINR(val)} (${((val / estimate.total.p50) * 100).toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Estimate Results</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-[10px] font-bold">
              MOCK DATA
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {formatNumber(estimate.inputs.built_up_area_sqft)} sq ft Residential Estimate
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Zone: <strong className="text-slate-200">{estimate.inputs.zone_id.replace('pune_', '').toUpperCase()}</strong> | Tier:{' '}
            <strong className="text-slate-200 uppercase">{estimate.inputs.quality_tier}</strong> | Floors:{' '}
            <strong className="text-slate-200">{estimate.inputs.floors}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/new')}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>New Estimate</span>
          </button>
          <button
            type="button"
            onClick={() => alert('PDF export simulated. Detailed server PDF service will generate in Phase 4.')}
            className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF (Mock)</span>
          </button>
        </div>
      </div>

      {/* 4 Headline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* P50 Median Estimate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Headline Estimate (P50)</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">MOCK</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatINRShorthand(estimate.total.p50)}</div>
          <div className="text-xs text-slate-500 font-medium">{formatINR(estimate.total.p50)} exact median</div>
        </div>

        {/* P10 - P90 Range */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Expected Range (P10 - P90)</div>
          <div className="text-lg font-bold text-slate-900">
            {formatINRShorthand(estimate.total.p10)} – {formatINRShorthand(estimate.total.p90)}
          </div>
          <div className="text-xs text-slate-500">80% empirical confidence bound</div>
        </div>

        {/* Confidence Level */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Confidence Label</div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-sm font-bold">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{estimate.confidence.label} Confidence</span>
          </div>
          <div className="text-xs text-slate-500 leading-tight">{estimate.confidence.reason}</div>
        </div>

        {/* Cost per sq ft */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost per Sq. Ft</div>
          <div className="text-3xl font-extrabold text-slate-900">{formatINR(estimate.total.cost_per_sqft)}</div>
          <div className="text-xs text-slate-500">Based on {formatNumber(estimate.inputs.built_up_area_sqft)} sq ft built-up</div>
        </div>
      </div>

      {/* Budget Verdict Card */}
      <div
        className={`p-6 rounded-2xl border ${
          estimate.budget.status === 'within'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : estimate.budget.status === 'tight'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : estimate.budget.status === 'below_minimum'
            ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-start gap-4">
          {estimate.budget.status === 'within' ? (
            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : estimate.budget.status === 'below_minimum' ? (
            <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h3 className="font-bold text-base tracking-tight">
              Budget Evaluation Verdict:{' '}
              <span className="uppercase">{estimate.budget.status.replace('_', ' ')}</span>
            </h3>
            <p className="text-sm leading-relaxed">{estimate.budget.message}</p>
          </div>
        </div>
      </div>

      {/* 9-Category Cost Breakdown & Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">9-Category Cost Breakdown</h2>
            <p className="text-xs text-slate-500">Component allocation summing exactly to P50 total</p>
          </div>

          <button
            type="button"
            onClick={() => setShowTableView(!showTableView)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            aria-label={showTableView ? 'Switch to Chart View' : 'Switch to Data Table View'}
          >
            {showTableView ? <PieIcon className="w-4 h-4 text-amber-600" /> : <TableIcon className="w-4 h-4 text-amber-600" />}
            <span>{showTableView ? 'Show Chart View' : 'Show Data Table Alternative'}</span>
          </button>
        </div>

        {/* Visual View: Chart vs Table */}
        {!showTableView ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="h-72 relative">
              <Doughnut data={chartData} options={chartOptions} />
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Allocated Categories</h3>
              <div className="space-y-2">
                {estimate.breakdown.slice(0, 5).map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-semibold text-slate-800">{item.category}</span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{formatINR(item.amount)}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.share_pct}% share</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Accessible Data Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse" aria-label="Cost Breakdown Table">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[11px] tracking-wider">
                  <th scope="col" className="p-3.5 rounded-l-lg">
                    Category
                  </th>
                  <th scope="col" className="p-3.5">
                    Share %
                  </th>
                  <th scope="col" className="p-3.5">
                    P50 Amount (₹)
                  </th>
                  <th scope="col" className="p-3.5">
                    P10 Bound (₹)
                  </th>
                  <th scope="col" className="p-3.5 rounded-r-lg">
                    P90 Bound (₹)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estimate.breakdown.map((row) => (
                  <tr key={row.category} className="hover:bg-slate-50 transition-colors">
                    <th scope="row" className="p-3.5 font-bold text-slate-900">
                      {row.category}
                    </th>
                    <td className="p-3.5 font-mono text-slate-600">{row.share_pct}%</td>
                    <td className="p-3.5 font-bold text-slate-900">{formatINR(row.amount)}</td>
                    <td className="p-3.5 text-slate-600">{formatINR(row.p10)}</td>
                    <td className="p-3.5 text-slate-600">{formatINR(row.p90)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 text-slate-900 font-bold border-t-2 border-amber-300">
                  <td className="p-3.5">TOTAL ESTIMATE</td>
                  <td className="p-3.5 font-mono">100.0%</td>
                  <td className="p-3.5 text-amber-700">{formatINR(estimate.total.p50)}</td>
                  <td className="p-3.5">{formatINR(estimate.total.p10)}</td>
                  <td className="p-3.5">{formatINR(estimate.total.p90)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Material Recommendations Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Material Recommendations Checklist</h2>
          <p className="text-xs text-slate-500">Rule-based specifications tailored to your selected quality tier</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {estimate.materials.map((m) => (
            <div key={m.category} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">{m.category}</span>
                <span className="text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold uppercase">
                  {m.primary.quality_level} Tier
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-amber-700 uppercase">Primary Recommendation</div>
                <div className="text-sm font-bold text-slate-900">{m.primary.grade_spec}</div>
                <div className="text-xs text-slate-600">{m.primary.description}</div>
                <div className="text-xs font-mono text-slate-500 font-semibold">{m.primary.unit_cost_range_inr}</div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500 leading-relaxed">
                <strong>Selection Rationale:</strong> {m.reason}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Counterfactual Top Drivers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Top Cost Drivers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {estimate.drivers.map((d) => (
            <div key={d.label} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{d.label}</span>
              </div>
              <div className="text-xs text-slate-600">{d.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Preliminary Estimate Disclaimer</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{estimate.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}

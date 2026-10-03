import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMetaOptions } from '../services/mockApi';
import { apiClient } from '../services/apiClient';
import { MetaOptions, ProjectInputs, QualityTier, ConstructionType } from '../types/estimate';
import { formatNumber, formatINR } from '../lib/formatters';
import { Calculator, ArrowRight, ArrowLeft, CheckCircle2, Home, MapPin, DollarSign, Layers } from 'lucide-react';

export function WizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [meta, setMeta] = useState<MetaOptions | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [inputs, setInputs] = useState<ProjectInputs>({
    built_up_area_sqft: 1800,
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    zone_id: 'pune_west',
    quality_tier: 'standard',
    construction_type: 'rcc_framed',
    plot_area_sqft: 1500,
    budget_inr: 3500000,
  });

  const [enableBudget, setEnableBudget] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMetaOptions().then((res) => {
      setMeta(res);
      setLoading(false);
    });
  }, []);

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!inputs.built_up_area_sqft || inputs.built_up_area_sqft < 300 || inputs.built_up_area_sqft > 10000) {
      errs.built_up_area_sqft = 'Built-up area must be between 300 and 10,000 sq ft';
    }
    if (!inputs.floors || inputs.floors < 1 || inputs.floors > 4) {
      errs.floors = 'Floors must be between 1 and 4';
    }
    if (!inputs.bedrooms || inputs.bedrooms < 1 || inputs.bedrooms > 10) {
      errs.bedrooms = 'Bedrooms must be between 1 and 10';
    }
    if (!inputs.bathrooms || inputs.bathrooms < 1 || inputs.bathrooms > 10) {
      errs.bathrooms = 'Bathrooms must be between 1 and 10';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!inputs.zone_id) errs.zone_id = 'Please select a Pune location zone';
    if (!inputs.quality_tier) errs.quality_tier = 'Please select a quality tier';
    if (!inputs.construction_type) errs.construction_type = 'Please select a construction type';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitEstimate = async () => {
    setSubmitting(true);
    const finalInputs = {
      ...inputs,
      budget_inr: enableBudget ? inputs.budget_inr : null,
    };
    try {
      // 1. Create real project in database
      const project = await apiClient.createProject({
        name: `Pune House - ${inputs.built_up_area_sqft} sq ft`,
        notes: `Quality Tier: ${inputs.quality_tier}, Zone: ${inputs.zone_id}`,
      });

      // 2. Create estimate snapshot for project
      const response = await apiClient.createEstimate(project.id, finalInputs);

      // Navigate to results page passing estimate response state
      navigate(`/app/estimates/${response.id}`, { state: { estimate: response } });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading estimation parameters (MOCK)...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Wizard Header & Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">4-Step Estimate Wizard</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Construction Estimate (MOCK)</h1>
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-1.5 rounded-full font-semibold">
            <Calculator className="w-4 h-4 text-amber-600" />
            <span>Step {step} of 4</span>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <nav aria-label="Wizard Steps" className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`p-3 rounded-xl border transition-all ${
              step === 1 ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4 mx-auto mb-1" />
            <span>1. Basics</span>
          </button>
          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className={`p-3 rounded-xl border transition-all ${
              step === 2 ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4 mx-auto mb-1" />
            <span>2. Quality</span>
          </button>
          <button
            type="button"
            onClick={() => validateStep1() && validateStep2() && setStep(3)}
            className={`p-3 rounded-xl border transition-all ${
              step === 3 ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4 mx-auto mb-1" />
            <span>3. Budget</span>
          </button>
          <button
            type="button"
            onClick={() => validateStep1() && validateStep2() && setStep(4)}
            className={`p-3 rounded-xl border transition-all ${
              step === 4 ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 mx-auto mb-1" />
            <span>4. Review</span>
          </button>
        </nav>
      </div>

      {/* Step Contents */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-md">
        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Step 1: Project Dimensions & Layout</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="area-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Built-up Area (Sq. Ft) *
                </label>
                <input
                  id="area-input"
                  type="number"
                  min={300}
                  max={10000}
                  value={inputs.built_up_area_sqft}
                  onChange={(e) => setInputs({ ...inputs, built_up_area_sqft: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 font-semibold"
                />
                {errors.built_up_area_sqft && <p className="text-xs text-red-600 mt-1">{errors.built_up_area_sqft}</p>}
                <p className="text-xs text-slate-500 mt-1">Total area across all floors (Trained range: 300 - 10,000 sq ft).</p>
              </div>

              <div>
                <label htmlFor="floors-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Number of Floors (1 - 4) *
                </label>
                <select
                  id="floors-input"
                  value={inputs.floors}
                  onChange={(e) => setInputs({ ...inputs, floors: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  <option value={1}>Ground Floor Only (G+0 / 1 Floor)</option>
                  <option value={2}>Ground + 1 Floor (G+1 / 2 Floors)</option>
                  <option value={3}>Ground + 2 Floors (G+2 / 3 Floors)</option>
                  <option value={4}>Ground + 3 Floors (G+3 / 4 Floors)</option>
                </select>
                {errors.floors && <p className="text-xs text-red-600 mt-1">{errors.floors}</p>}
              </div>

              <div>
                <label htmlFor="bedrooms-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Number of Bedrooms *
                </label>
                <input
                  id="bedrooms-input"
                  type="number"
                  min={1}
                  max={10}
                  value={inputs.bedrooms}
                  onChange={(e) => setInputs({ ...inputs, bedrooms: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
                {errors.bedrooms && <p className="text-xs text-red-600 mt-1">{errors.bedrooms}</p>}
              </div>

              <div>
                <label htmlFor="bathrooms-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Number of Bathrooms *
                </label>
                <input
                  id="bathrooms-input"
                  type="number"
                  min={1}
                  max={10}
                  value={inputs.bathrooms}
                  onChange={(e) => setInputs({ ...inputs, bathrooms: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
                {errors.bathrooms && <p className="text-xs text-red-600 mt-1">{errors.bathrooms}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: LOCATION & QUALITY */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Step 2: Location Zone & Quality Tier</h2>

            <div className="space-y-4">
              <label htmlFor="zone-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Pune Location Zone *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {meta?.zones.map((z) => (
                  <button
                    key={z.zone_id}
                    type="button"
                    onClick={() => setInputs({ ...inputs, zone_id: z.zone_id })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      inputs.zone_id === z.zone_id
                        ? 'bg-amber-50 border-amber-500 text-slate-900 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">{z.zone_name}</div>
                    <div className="text-xs text-slate-500 mt-1">{z.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Select Quality Tier *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {meta?.quality_tiers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInputs({ ...inputs, quality_tier: t.id as QualityTier })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      inputs.quality_tier === t.id
                        ? 'bg-amber-50 border-amber-500 text-slate-900 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">{t.name}</div>
                    <div className="text-xs text-amber-700 font-semibold mt-1">Indicative: ~₹{t.indicative_rate_sqft} / sq ft</div>
                    <div className="text-xs text-slate-500 mt-2">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label htmlFor="const-type" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Construction Structural Type *
              </label>
              <select
                id="const-type"
                value={inputs.construction_type}
                onChange={(e) => setInputs({ ...inputs, construction_type: e.target.value as ConstructionType })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium text-sm"
              >
                {meta?.construction_types.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: BUDGET */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Step 3: Target Budget Check (Optional)</h2>

            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                id="enable-budget-toggle"
                type="checkbox"
                checked={enableBudget}
                onChange={(e) => setEnableBudget(e.target.checked)}
                className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded border-slate-300"
              />
              <label htmlFor="enable-budget-toggle" className="text-sm font-semibold text-slate-900 cursor-pointer">
                Evaluate estimate against a target maximum budget
              </label>
            </div>

            {enableBudget && (
              <div className="space-y-4 max-w-md pt-2">
                <label htmlFor="budget-amount" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Target Budget Amount (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    id="budget-amount"
                    type="number"
                    step={50000}
                    value={inputs.budget_inr || ''}
                    onChange={(e) => setInputs({ ...inputs, budget_inr: Number(e.target.value) })}
                    placeholder="3500000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Formatted preview:{' '}
                  <strong className="text-slate-900 font-semibold">{formatINR(inputs.budget_inr || 0)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Step 4: Review Inputs & Calculate Estimate</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
                  <span>1. Dimensions</span>
                  <button type="button" onClick={() => setStep(1)} className="text-amber-600 hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-sm text-slate-800 space-y-1">
                  <div>
                    Built-up Area: <strong>{formatNumber(inputs.built_up_area_sqft)} sq ft</strong>
                  </div>
                  <div>
                    Floors: <strong>{inputs.floors}</strong> | Rooms: <strong>{inputs.bedrooms} Bed, {inputs.bathrooms} Bath</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
                  <span>2. Location & Quality</span>
                  <button type="button" onClick={() => setStep(2)} className="text-amber-600 hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-sm text-slate-800 space-y-1">
                  <div>
                    Zone: <strong>{meta?.zones.find((z) => z.zone_id === inputs.zone_id)?.zone_name}</strong>
                  </div>
                  <div>
                    Quality Tier: <strong className="uppercase">{inputs.quality_tier}</strong>
                  </div>
                  <div>
                    Type: <strong className="uppercase">{inputs.construction_type.replace('_', ' ')}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 md:col-span-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
                  <span>3. Budget Evaluation</span>
                  <button type="button" onClick={() => setStep(3)} className="text-amber-600 hover:underline">
                    Edit
                  </button>
                </div>
                <div className="text-sm text-slate-800">
                  Target Budget:{' '}
                  <strong>{enableBudget && inputs.budget_inr ? formatINR(inputs.budget_inr) : 'Not Provided'}</strong>
                </div>
              </div>
            </div>

            {/* Submission Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="text-xs text-amber-900">
                <strong>Notice:</strong> Submitting will process inputs via the typed MOCK API engine.
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitEstimate}
                className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm transition-colors flex items-center gap-2 shadow-md"
              >
                {submitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Calculate Estimate (MOCK)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between items-center pt-6 mt-8 border-t border-slate-100">
          <button
            type="button"
            disabled={step === 1 || submitting}
            onClick={handleBack}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-sm transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

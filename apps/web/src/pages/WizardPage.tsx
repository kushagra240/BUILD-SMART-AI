import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMetaOptions, calculateEstimateMock } from '../services/mockApi';
import { MetaOptions, QualityTier, ConstructionType } from '../types/estimate';
import { formatINR, formatNumber } from '../lib/formatters';
import { HouseSchematic } from '../components/common/HouseSchematic';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ArrowRight, ArrowLeft, Check, Info } from 'lucide-react';

interface WizardFormData {
  projectName: string;
  city: string;
  locality: string;
  builtUpArea: number;
  plotArea: number;
  floors: number;
  qualityTier: QualityTier;
  structuralSystem: ConstructionType;
  walling: string;
  flooring: string;
  windows: string;
}

export function WizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [, setMeta] = useState<MetaOptions | null>(null);

  const [form, setForm] = useState<WizardFormData>({
    projectName: 'Deshmukh residence',
    city: 'Pune, Maharashtra',
    locality: 'Baner',
    builtUpArea: 1800,
    plotArea: 1200,
    floors: 2,
    qualityTier: 'standard',
    structuralSystem: 'rcc_framed',
    walling: 'aac_blocks',
    flooring: 'vitrified_standard',
    windows: 'upvc_standard',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMetaOptions().then((res) => {
      setMeta(res);
      setLoading(false);
    });
  }, []);

  const ratePerSqFt =
    form.qualityTier === 'economy' ? 2000 : form.qualityTier === 'premium' ? 3100 : 2400;
  const calculatedTotal = form.builtUpArea * ratePerSqFt;
  const approxPerFloor =
    form.floors > 0 ? Math.round(form.builtUpArea / form.floors) : form.builtUpArea;

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.builtUpArea || form.builtUpArea <= 0) {
      errs.builtUpArea = 'Enter an area greater than 0 sq ft';
    } else if (form.builtUpArea < 300 || form.builtUpArea > 10000) {
      errs.builtUpArea = 'Built-up area must be between 300 and 10,000 sq ft';
    }
    if (!form.floors || form.floors < 1) {
      errs.floors = 'Select number of floors';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleCalculate = async () => {
    setSubmitting(true);
    try {
      const estimate = await calculateEstimateMock({
        built_up_area_sqft: form.builtUpArea,
        floors: form.floors,
        bedrooms: 3,
        bathrooms: 3,
        zone_id: 'pune_west',
        quality_tier: form.qualityTier,
        construction_type: form.structuralSystem,
        plot_area_sqft: form.plotArea,
      });

      navigate('/app/estimates/BS-2026-004', {
        state: {
          estimate,
          projectName: form.projectName,
          locality: `${form.locality}, Pune`,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 bg-paper">
        <div className="w-8 h-8 border-2 border-brick border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-ink-soft">Loading options...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
        {/* Step Kicker & Heading */}
        <div className="space-y-2 border-b border-ink/10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
              NEW ESTIMATE / STEP 0{step}
            </span>
            <SampleDataBadge text="Sample data" />
          </div>

          <h1 className="font-headline text-2xl sm:text-4xl font-bold text-ink tracking-tight">
            {step === 1
              ? 'Tell us about the home you have in mind.'
              : 'Choose how you want to build.'}
          </h1>

          <p className="text-xs sm:text-sm text-ink-soft font-sans">
            {step === 1
              ? 'Start with the site and size. Approximate measurements are fine for a first estimate.'
              : 'A few practical choices set the starting budget. You can revise these later.'}
          </p>

          {/* Stepper Pills */}
          <div className="flex items-center gap-2 pt-3 font-mono text-xs">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                step === 1
                  ? 'bg-forest text-paper font-semibold'
                  : 'bg-paper-deep text-ink border border-ink/14 hover:bg-clay'
              }`}
            >
              <span>1</span>
              <span>Project & site</span>
            </button>
            <span className="text-ink-soft">›</span>
            <button
              type="button"
              onClick={() => validateStep1() && setStep(2)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
                step === 2
                  ? 'bg-forest text-paper font-semibold'
                  : 'border border-ink/14 text-ink-soft hover:text-ink'
              }`}
            >
              <span>2</span>
              <span>Construction preferences</span>
            </button>
            <span className="text-ink-soft">›</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded text-xs text-ink-soft border border-ink/10">
              <span>3</span>
              <span>Your estimate</span>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: PROJECT & SITE ================= */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Form Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Project & location section */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-4">
                <h2 className="font-headline text-lg font-bold text-ink">
                  Project & location
                </h2>

                <div className="space-y-1.5">
                  <label htmlFor="projectName" className="block text-xs font-medium text-ink">
                    Project name
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    placeholder="e.g. Deshmukh residence"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="city" className="block text-xs font-medium text-ink">City</label>
                      <span className="text-[10px] font-mono text-ink-soft bg-paper px-1.5 py-0.5 rounded border border-ink/14">
                        Fixed region
                      </span>
                    </div>
                    <input
                      id="city"
                      type="text"
                      disabled
                      value={form.city}
                      className="w-full px-3 py-2 bg-paper/60 border border-ink/14 rounded-md text-sm text-ink-soft cursor-not-allowed font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="locality" className="block text-xs font-medium text-ink">
                      Locality
                    </label>
                    <select
                      id="locality"
                      value={form.locality}
                      onChange={(e) => setForm({ ...form, locality: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      <option value="Baner">Baner (West Pune)</option>
                      <option value="Kothrud">Kothrud (West Pune)</option>
                      <option value="Bavdhan">Bavdhan (West Pune)</option>
                      <option value="Wagholi">Wagholi (East Pune)</option>
                      <option value="Kharadi">Kharadi (East Pune)</option>
                      <option value="Wakad">Wakad (PCMC / North-West)</option>
                      <option value="Aundh">Aundh (Central-West)</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-ink-soft leading-relaxed">
                  This estimate uses illustrative Pune planning assumptions, not verified live rates.
                </p>
              </div>

              {/* Area & floors section */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-4">
                <h2 className="font-headline text-lg font-bold text-ink">
                  Area & floors
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Built-up Area */}
                  <div className="space-y-1.5">
                    <label htmlFor="builtUpArea" className="block text-xs font-medium text-ink">
                      Total built-up area *
                    </label>
                    <div className="relative">
                      <input
                        id="builtUpArea"
                        type="number"
                        min="300"
                        max="10000"
                        value={form.builtUpArea || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setForm({ ...form, builtUpArea: val });
                          if (val > 0) setErrors({ ...errors, builtUpArea: '' });
                        }}
                        className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-mono focus-ring pr-16 ${
                          errors.builtUpArea ? 'border-2 border-error' : 'border border-ink/14'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-ink-soft font-mono pointer-events-none">
                        sq ft
                      </span>
                    </div>
                    {errors.builtUpArea ? (
                      <p className="text-xs text-error font-medium">{errors.builtUpArea}</p>
                    ) : (
                      <p className="text-[11px] text-ink-soft">Add the built-up area of every floor.</p>
                    )}
                  </div>

                  {/* Plot area */}
                  <div className="space-y-1.5">
                    <label htmlFor="plotArea" className="block text-xs font-medium text-ink">
                      Plot area
                    </label>
                    <div className="relative">
                      <input
                        id="plotArea"
                        type="number"
                        value={form.plotArea || ''}
                        onChange={(e) => setForm({ ...form, plotArea: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink font-mono focus-ring pr-16"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-ink-soft font-mono pointer-events-none">
                        sq ft
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-soft">
                      Optional. Land area is not used to price construction.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Number of floors */}
                  <div className="space-y-1.5">
                    <label htmlFor="floors" className="block text-xs font-medium text-ink">
                      Number of floors *
                    </label>
                    <select
                      id="floors"
                      value={form.floors}
                      onChange={(e) => setForm({ ...form, floors: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      <option value="1">Ground only · 1 floor</option>
                      <option value="2">G + 1 · Ground + first</option>
                      <option value="3">G + 2 · Ground + 2 floors</option>
                      <option value="4">G + 3 · Ground + 3 floors</option>
                    </select>
                  </div>

                  {/* Approx per floor */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-ink">
                      Approx. built-up per floor
                    </label>
                    <div className="px-3 py-2 bg-paper/60 border border-ink/14 rounded-md text-sm font-mono text-ink flex justify-between">
                      <span>{formatNumber(approxPerFloor)} sq ft</span>
                      <span className="text-[11px] text-ink-soft">
                        {form.builtUpArea} sq ft ÷ {form.floors} floors
                      </span>
                    </div>
                  </div>
                </div>

                {/* Callout Info Box */}
                <div className="bg-clay/40 border border-ink/14 rounded-md p-3.5 flex gap-2.5 items-start text-xs text-ink-soft">
                  <Info className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-ink">Area is not the same as plot size.</strong> Your {formatNumber(form.plotArea)} sq ft plot may hold {formatNumber(form.builtUpArea)} sq ft across floors. This estimate uses the total {formatNumber(form.builtUpArea)} sq ft, not {formatNumber(form.plotArea)} sq ft.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs text-ink-soft">
                  * Required fields · Your estimate is not saved yet
                </span>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring"
                >
                  <span>Continue to preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Information Panel */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
                <h3 className="font-headline text-base font-bold text-ink">
                  Measure the whole home
                </h3>
                <HouseSchematic
                  groundArea={`${formatNumber(approxPerFloor)} sq ft`}
                  firstFloorArea={`${formatNumber(approxPerFloor)} sq ft`}
                  totalArea={`${formatNumber(form.builtUpArea)} sq ft`}
                />
                <p className="text-[11px] text-ink-soft leading-relaxed pt-2 border-t border-ink/10">
                  Include the covered area of all floors, including walls. Do not add open terraces or gardens. Confirm area definitions with your architect.
                </p>
              </div>

              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-2">
                <h3 className="font-headline text-base font-bold text-ink">
                  What happens next
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  Choose a construction quality and finishes. We&apos;ll outline nine cost categories and practical material options.
                </p>
                <p className="text-[11px] text-ink-soft">
                  No site visit or structural assessment is included.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CONSTRUCTION PREFERENCES ================= */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Form Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Construction Quality Section */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-4">
                <h2 className="font-headline text-lg font-bold text-ink">
                  Construction quality
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Economy */}
                  <label
                    className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                      form.qualityTier === 'economy'
                        ? 'border-forest bg-paper shadow-card ring-1 ring-forest'
                        : 'border-ink/14 bg-paper/60 hover:bg-paper'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qualityTier"
                      value="economy"
                      checked={form.qualityTier === 'economy'}
                      onChange={() => setForm({ ...form, qualityTier: 'economy' })}
                      className="sr-only"
                    />
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-ink">Economy</span>
                        {form.qualityTier === 'economy' && (
                          <span className="w-4 h-4 rounded-full bg-forest text-paper flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="font-headline text-xl font-bold text-ink">₹2,000</div>
                      <div className="text-[11px] font-mono text-ink-soft">
                        per sq ft · planning assumption
                      </div>
                      <div className="text-xs text-ink-soft pt-1 font-sans">
                        Simple, durable essentials
                      </div>
                    </div>
                  </label>

                  {/* Standard */}
                  <label
                    className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                      form.qualityTier === 'standard'
                        ? 'border-forest bg-paper shadow-card ring-1 ring-forest'
                        : 'border-ink/14 bg-paper/60 hover:bg-paper'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qualityTier"
                      value="standard"
                      checked={form.qualityTier === 'standard'}
                      onChange={() => setForm({ ...form, qualityTier: 'standard' })}
                      className="sr-only"
                    />
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-ink">Standard</span>
                        {form.qualityTier === 'standard' && (
                          <span className="w-4 h-4 rounded-full bg-forest text-paper flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="font-headline text-xl font-bold text-ink">₹2,400</div>
                      <div className="text-[11px] font-mono text-ink-soft">
                        per sq ft · planning assumption
                      </div>
                      <div className="text-xs text-ink-soft pt-1 font-sans">
                        Balanced everyday comfort
                      </div>
                    </div>
                  </label>

                  {/* Premium */}
                  <label
                    className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                      form.qualityTier === 'premium'
                        ? 'border-forest bg-paper shadow-card ring-1 ring-forest'
                        : 'border-ink/14 bg-paper/60 hover:bg-paper'
                    }`}
                  >
                    <input
                      type="radio"
                      name="qualityTier"
                      value="premium"
                      checked={form.qualityTier === 'premium'}
                      onChange={() => setForm({ ...form, qualityTier: 'premium' })}
                      className="sr-only"
                    />
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm text-ink">Premium</span>
                        {form.qualityTier === 'premium' && (
                          <span className="w-4 h-4 rounded-full bg-forest text-paper flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="font-headline text-xl font-bold text-ink">₹3,100</div>
                      <div className="text-[11px] font-mono text-ink-soft">
                        per sq ft · planning assumption
                      </div>
                      <div className="text-xs text-ink-soft pt-1 font-sans">
                        Higher-spec finishes
                      </div>
                    </div>
                  </label>
                </div>

                <p className="text-[11px] text-ink-soft leading-relaxed">
                  Illustrative rates include a 5% contingency. They are not supplier quotes or current verified market rates.
                </p>
              </div>

              {/* Structure & finishes 2x2 grid */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-4">
                <h2 className="font-headline text-lg font-bold text-ink">
                  Structure & finishes
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="structuralSystem" className="block text-xs font-medium text-ink">
                      Structural system
                    </label>
                    <select
                      id="structuralSystem"
                      value={form.structuralSystem}
                      onChange={(e) =>
                        setForm({ ...form, structuralSystem: e.target.value as ConstructionType })
                      }
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      <option value="rcc_framed">RCC framed structure</option>
                      <option value="load_bearing">Load-bearing masonry</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="walling" className="block text-xs font-medium text-ink">
                      Walling preference
                    </label>
                    <select
                      id="walling"
                      value={form.walling}
                      onChange={(e) => setForm({ ...form, walling: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      <option value="aac_blocks">AAC block masonry</option>
                      <option value="red_clay">Red clay brick</option>
                      <option value="fly_ash">Fly ash brick</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="flooring" className="block text-xs font-medium text-ink">
                      Flooring
                    </label>
                    <select
                      id="flooring"
                      value={form.flooring}
                      onChange={(e) => setForm({ ...form, flooring: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      <option value="vitrified_standard">Standard vitrified tiles</option>
                      <option value="vitrified_large">Large format vitrified tiles</option>
                      <option value="ceramic">Ceramic tiles</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="windows" className="block text-xs font-medium text-ink">
                      Windows
                    </label>
                    <select
                      id="windows"
                      value={form.windows}
                      onChange={(e) => setForm({ ...form, windows: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      <option value="upvc_standard">uPVC, standard glazing</option>
                      <option value="aluminium_anodized">Aluminium, anodized basic</option>
                      <option value="wooden_teak">Engineered wood frame</option>
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-ink-soft leading-relaxed">
                  Floor structure, member sizes and material specifications need an engineer&apos;s design.
                </p>
              </div>

              {/* What this budget covers */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-3">
                <h2 className="font-headline text-lg font-bold text-ink">
                  What this budget covers
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-forest font-semibold">
                      INCLUDED IN THIS ESTIMATE
                    </div>
                    <ul className="space-y-1.5 text-ink">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-forest" />
                        <span>Civil structure and basic finishes</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-forest" />
                        <span>Electrical and plumbing works</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-forest" />
                        <span>Standard sanitary fixtures</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-forest" />
                        <span>5% contingency allowance</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft font-semibold">
                      BUDGET SEPARATELY
                    </div>
                    <ul className="space-y-1.5 text-ink-soft">
                      <li>· Land and statutory approval fees</li>
                      <li>· Architect and professional fees</li>
                      <li>· Compound wall, landscaping, external works</li>
                      <li>· Furniture, modular kitchen, lift and solar</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Form Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-ink/14 bg-paper hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to project details</span>
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring"
                >
                  {submitting ? (
                    <span>Calculating...</span>
                  ) : (
                    <>
                      <span>Calculate estimate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Information Panel (Your project, at a glance) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-clay text-ink-soft border border-ink/14 font-semibold">
                    READY TO ESTIMATE
                  </span>
                  <SampleDataBadge text="Sample data" variant="subtle" />
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-headline text-lg font-bold text-ink">
                    {form.projectName}
                  </h3>
                  <p className="text-xs text-ink-soft">{form.locality}, Pune</p>
                </div>

                <div className="space-y-2 text-xs font-sans border-t border-b border-ink/10 py-3">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Building</span>
                    <span className="font-mono text-ink">G+{form.floors - 1} · {form.floors} floors</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Total built-up</span>
                    <span className="font-mono text-ink">{formatNumber(form.builtUpArea)} sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Plot area</span>
                    <span className="font-mono text-ink">{formatNumber(form.plotArea)} sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Quality</span>
                    <span className="font-semibold text-ink capitalize">{form.qualityTier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Planning rate</span>
                    <span className="font-mono text-ink">₹{formatNumber(ratePerSqFt)} / sq ft</span>
                  </div>
                  <div className="text-[11px] font-mono text-ink-soft pt-1 border-t border-ink/10">
                    {formatNumber(form.builtUpArea)} sq ft × ₹{formatNumber(ratePerSqFt)} / sq ft
                  </div>
                </div>

                {/* Big Indicative Total in Card */}
                <div className="space-y-1">
                  <div className="font-headline text-3xl font-bold text-brick tracking-tight">
                    {formatINR(calculatedTotal)}
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    Preliminary total, including contingency
                  </p>
                </div>
              </div>

              {/* A sound starting assumption callout */}
              <div className="bg-clay/50 border border-ink/14 rounded-lg p-4 space-y-1.5 text-xs">
                <div className="font-semibold text-ink font-sans flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-forest" />
                  <span>A sound starting assumption</span>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  Assumes a regular site, normal foundations and no basement. Soil conditions and access can affect costs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

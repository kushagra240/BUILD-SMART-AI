import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { calculateEstimateMock } from '../services/mockApi';
import {
  apiClient,
  ApiError,
  isMockApi,
  type EstimateCreate,
  type EstimateZone,
} from '../services/apiClient';
import { apiErrorMessage } from '../lib/errorMessage';
import { QualityTier, ConstructionType } from '../types/estimate';
import { formatINR, formatNumber } from '../lib/formatters';
import { HouseSchematic } from '../components/common/HouseSchematic';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { ErrorState } from '../components/common/AsyncState';
import { ArrowRight, ArrowLeft, Check, Info } from 'lucide-react';

interface WizardFormData {
  projectName: string;
  city: string;
  locality: string;
  zoneId: string;
  builtUpArea: number;
  plotArea: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  qualityTier: QualityTier;
  structuralSystem: ConstructionType;
  walling: string;
  flooring: string;
  windows: string;
}

const QUALITY_RATES: Record<QualityTier, number> = {
  economy: 2000,
  standard: 2400,
  premium: 3100,
};

const QUALITY_ORDER: QualityTier[] = ['economy', 'standard', 'premium'];

const LOCALITIES = ['Baner', 'Kothrud', 'Bavdhan', 'Wagholi', 'Kharadi', 'Wakad', 'Aundh'] as const;

const WALLING_OPTIONS = ['aac_blocks', 'red_clay', 'fly_ash'] as const;
const FLOORING_OPTIONS = ['vitrified_standard', 'vitrified_large', 'ceramic'] as const;
const WINDOWS_OPTIONS = ['upvc_standard', 'aluminium_anodized', 'wooden_teak'] as const;

const FLOOR_OPTIONS = [
  { value: 1, key: 'ground' },
  { value: 2, key: 'g1' },
  { value: 3, key: 'g2' },
  { value: 4, key: 'g3' },
] as const;

export function WizardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [zones, setZones] = useState<EstimateZone[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitFieldErrors, setSubmitFieldErrors] = useState<Record<string, string>>({});
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const [form, setForm] = useState<WizardFormData>({
    projectName: 'Deshmukh residence',
    city: 'Pune, Maharashtra',
    locality: 'Baner',
    zoneId: '',
    builtUpArea: 1800,
    plotArea: 1200,
    floors: 2,
    bedrooms: 3,
    bathrooms: 3,
    qualityTier: 'standard',
    structuralSystem: 'rcc_framed',
    walling: 'aac_blocks',
    flooring: 'vitrified_standard',
    windows: 'upvc_standard',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadOptions = useCallback(() => {
    setLoading(true);
    setOptionsError(null);
    apiClient
      .getEstimateZones()
      .then((response) => {
        setZones(response);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        setOptionsError(apiErrorMessage(cause, t('wizard.errors.loadZones')));
        setLoading(false);
      });
  }, [t]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const ratePerSqFt = QUALITY_RATES[form.qualityTier];
  const calculatedTotal = form.builtUpArea * ratePerSqFt;
  const approxPerFloor =
    form.floors > 0 ? Math.round(form.builtUpArea / form.floors) : form.builtUpArea;

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.projectName.trim()) {
      errs.projectName = t('wizard.validation.projectName');
    }
    if (!form.builtUpArea || form.builtUpArea <= 0) {
      errs.builtUpArea = t('wizard.validation.builtUpAreaRequired');
    } else if (form.builtUpArea < 300 || form.builtUpArea > 10000) {
      errs.builtUpArea = t('wizard.validation.builtUpAreaRange');
    }
    if (!form.floors || form.floors < 1) {
      errs.floors = t('wizard.validation.floors');
    }
    if (!form.bedrooms || form.bedrooms < 1 || form.bedrooms > 20) {
      errs.bedrooms = t('wizard.validation.bedrooms');
    }
    if (!form.bathrooms || form.bathrooms < 1 || form.bathrooms > 20) {
      errs.bathrooms = t('wizard.validation.bathrooms');
    }
    if (!form.zoneId) {
      errs.zoneId = t('wizard.validation.zone');
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

  const buildInputs = (): EstimateCreate => ({
    built_up_area_sqft: form.builtUpArea,
    floors: form.floors,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    zone_id: form.zoneId,
    quality_tier: form.qualityTier,
    construction_type: form.structuralSystem,
    plot_area_sqft: form.plotArea > 0 ? form.plotArea : null,
  });

  const handleCalculate = async () => {
    setSubmitError(null);
    setSubmitFieldErrors({});
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      if (isMockApi()) {
        const estimate = await calculateEstimateMock(buildInputs());
        navigate(`/app/estimates/${estimate.id}`, {
          state: {
            estimate,
            projectName: form.projectName,
            locality: `${form.locality}, Pune`,
          },
        });
        return;
      }

      // Estimates belong to a project, so create one first and reuse it if the
      // user retries after a failed calculation.
      let projectId = createdProjectId;
      if (!projectId) {
        const project = await apiClient.createProject({
          name: form.projectName.trim(),
          notes: `${form.locality}, Pune`,
        });
        projectId = project.id;
        setCreatedProjectId(projectId);
      }

      const estimate = await apiClient.createEstimate(projectId, buildInputs());
      navigate(`/app/estimates/${estimate.id}`, {
        state: {
          estimate,
          projectName: form.projectName,
          locality: `${form.locality}, Pune`,
        },
      });
    } catch (cause: unknown) {
      if (cause instanceof ApiError) {
        setSubmitFieldErrors(cause.fieldErrors());
      }
      setSubmitError(apiErrorMessage(cause, t('wizard.errors.calculateFallback')));
    } finally {
      setSubmitting(false);
    }
  };

  if (optionsError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-paper px-4">
        <div className="w-full max-w-2xl">
          <ErrorState message={optionsError} onRetry={loadOptions} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 bg-paper">
        <div className="w-8 h-8 border-2 border-brick border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-ink-soft">{t('wizard.loading')}</span>
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
              {t('wizard.kicker', { step })}
            </span>
            <SampleDataBadge text={t('common.sampleData')} />
          </div>

          <h1 className="font-headline text-2xl sm:text-4xl font-bold text-ink tracking-tight">
            {step === 1 ? t('wizard.headings.step1') : t('wizard.headings.step2')}
          </h1>

          <p className="text-xs sm:text-sm text-ink-soft font-sans">
            {step === 1 ? t('wizard.subtitles.step1') : t('wizard.subtitles.step2')}
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
              <span>{t('wizard.steps.projectSite')}</span>
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
              <span>{t('wizard.steps.preferences')}</span>
            </button>
            <span className="text-ink-soft">›</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded text-xs text-ink-soft border border-ink/10">
              <span>3</span>
              <span>{t('wizard.steps.estimate')}</span>
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
                  {t('wizard.sections.projectLocation')}
                </h2>

                <div className="space-y-1.5">
                  <label htmlFor="projectName" className="block text-xs font-medium text-ink">
                    {t('wizard.fields.projectName')}
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-sans focus-ring ${
                      errors.projectName ? 'border-2 border-error' : 'border border-ink/14'
                    }`}
                    placeholder={t('wizard.fields.projectNamePlaceholder')}
                  />
                  {errors.projectName && (
                    <p className="text-xs text-error font-medium">{errors.projectName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="city" className="block text-xs font-medium text-ink">
                        {t('wizard.fields.city')}
                      </label>
                      <span className="text-[10px] font-mono text-ink-soft bg-paper px-1.5 py-0.5 rounded border border-ink/14">
                        {t('wizard.fields.fixedRegion')}
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
                      {t('wizard.fields.locality')}
                    </label>
                    <select
                      id="locality"
                      value={form.locality}
                      onChange={(e) => setForm({ ...form, locality: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      {LOCALITIES.map((id) => (
                        <option key={id} value={id}>
                          {t(`wizard.localities.${id.toLowerCase()}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="zone" className="block text-xs font-medium text-ink">
                    {t('wizard.fields.zone')}
                  </label>
                  <select
                    id="zone"
                    value={form.zoneId}
                    onChange={(e) => {
                      setForm({ ...form, zoneId: e.target.value });
                      if (e.target.value) setErrors({ ...errors, zoneId: '' });
                    }}
                    className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-sans focus-ring ${
                      errors.zoneId ? 'border-2 border-error' : 'border border-ink/14'
                    }`}
                  >
                    <option value="">{t('wizard.fields.zonePlaceholder')}</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {t(`enum.zones.${zone.id}`, { defaultValue: zone.name })}
                      </option>
                    ))}
                  </select>
                  {errors.zoneId ? (
                    <p className="text-xs text-error font-medium">{errors.zoneId}</p>
                  ) : (
                    <p className="text-[11px] text-ink-soft">{t('wizard.hints.zone')}</p>
                  )}
                </div>

                <p className="text-[11px] text-ink-soft leading-relaxed">
                  {t('wizard.hints.planningAssumption')}
                </p>
              </div>

              {/* Area & floors section */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-4">
                <h2 className="font-headline text-lg font-bold text-ink">
                  {t('wizard.sections.areaFloors')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Built-up Area */}
                  <div className="space-y-1.5">
                    <label htmlFor="builtUpArea" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.builtUpArea')}
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
                        {t('common.sqFt')}
                      </span>
                    </div>
                    {errors.builtUpArea ? (
                      <p className="text-xs text-error font-medium">{errors.builtUpArea}</p>
                    ) : (
                      <p className="text-[11px] text-ink-soft">{t('wizard.hints.addAllFloors')}</p>
                    )}
                  </div>

                  {/* Plot area */}
                  <div className="space-y-1.5">
                    <label htmlFor="plotArea" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.plotArea')}
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
                        {t('common.sqFt')}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-soft">{t('wizard.hints.plotOptional')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Number of floors */}
                  <div className="space-y-1.5">
                    <label htmlFor="floors" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.floors')}
                    </label>
                    <select
                      id="floors"
                      value={form.floors}
                      onChange={(e) => setForm({ ...form, floors: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      {FLOOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`wizard.floors.${option.key}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Approx per floor */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-ink">
                      {t('wizard.fields.approxPerFloor')}
                    </label>
                    <div className="px-3 py-2 bg-paper/60 border border-ink/14 rounded-md text-sm font-mono text-ink flex justify-between">
                      <span>
                        {formatNumber(approxPerFloor)} {t('common.sqFt')}
                      </span>
                      <span className="text-[11px] text-ink-soft">
                        {t('wizard.floors.perFloorFormula', {
                          count: form.floors,
                          area: formatNumber(form.builtUpArea),
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Number of bedrooms */}
                  <div className="space-y-1.5">
                    <label htmlFor="bedrooms" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.bedrooms')}
                    </label>
                    <input
                      id="bedrooms"
                      type="number"
                      min="1"
                      max="20"
                      value={form.bedrooms || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({ ...form, bedrooms: val });
                        if (val >= 1 && val <= 20) setErrors({ ...errors, bedrooms: '' });
                      }}
                      className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-mono focus-ring ${
                        errors.bedrooms ? 'border-2 border-error' : 'border border-ink/14'
                      }`}
                    />
                    {errors.bedrooms && (
                      <p className="text-xs text-error font-medium">{errors.bedrooms}</p>
                    )}
                  </div>

                  {/* Number of bathrooms */}
                  <div className="space-y-1.5">
                    <label htmlFor="bathrooms" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.bathrooms')}
                    </label>
                    <input
                      id="bathrooms"
                      type="number"
                      min="1"
                      max="20"
                      value={form.bathrooms || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setForm({ ...form, bathrooms: val });
                        if (val >= 1 && val <= 20) setErrors({ ...errors, bathrooms: '' });
                      }}
                      className={`w-full px-3 py-2 bg-paper rounded-md text-sm text-ink font-mono focus-ring ${
                        errors.bathrooms ? 'border-2 border-error' : 'border border-ink/14'
                      }`}
                    />
                    {errors.bathrooms && (
                      <p className="text-xs text-error font-medium">{errors.bathrooms}</p>
                    )}
                  </div>
                </div>

                {/* Callout Info Box */}
                <div className="bg-clay/40 border border-ink/14 rounded-md p-3.5 flex gap-2.5 items-start text-xs text-ink-soft">
                  <Info className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-ink">{t('wizard.areaCallout.title')}</strong>{' '}
                    {t('wizard.areaCallout.body', {
                      plot: formatNumber(form.plotArea),
                      built: formatNumber(form.builtUpArea),
                    })}
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs text-ink-soft">{t('wizard.requiredNote')}</span>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring"
                >
                  <span>{t('wizard.actions.continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Information Panel */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-3">
                <h3 className="font-headline text-base font-bold text-ink">
                  {t('wizard.side.measureTitle')}
                </h3>
                <HouseSchematic
                  groundArea={`${formatNumber(approxPerFloor)} ${t('common.sqFt')}`}
                  firstFloorArea={`${formatNumber(approxPerFloor)} ${t('common.sqFt')}`}
                  totalArea={`${formatNumber(form.builtUpArea)} ${t('common.sqFt')}`}
                />
                <p className="text-[11px] text-ink-soft leading-relaxed pt-2 border-t border-ink/10">
                  {t('wizard.side.measureBody')}
                </p>
              </div>

              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 space-y-2">
                <h3 className="font-headline text-base font-bold text-ink">
                  {t('wizard.side.nextTitle')}
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {t('wizard.side.nextBody')}
                </p>
                <p className="text-[11px] text-ink-soft">{t('wizard.side.nextNote')}</p>
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
                  {t('wizard.sections.quality')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {QUALITY_ORDER.map((tier) => {
                    const selected = form.qualityTier === tier;
                    return (
                      <label
                        key={tier}
                        className={`relative p-4 rounded-lg border cursor-pointer transition-all ${
                          selected
                            ? 'border-forest bg-paper shadow-card ring-1 ring-forest'
                            : 'border-ink/14 bg-paper/60 hover:bg-paper'
                        }`}
                      >
                        <input
                          type="radio"
                          name="qualityTier"
                          value={tier}
                          checked={selected}
                          onChange={() => setForm({ ...form, qualityTier: tier })}
                          className="sr-only"
                        />
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-sm text-ink">
                              {t(`enum.quality.${tier}`)}
                            </span>
                            {selected && (
                              <span className="w-4 h-4 rounded-full bg-forest text-paper flex items-center justify-center text-[10px]">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="font-headline text-xl font-bold text-ink">
                            {formatINR(QUALITY_RATES[tier])}
                          </div>
                          <div className="text-[11px] font-mono text-ink-soft">
                            {t('wizard.quality.perSqFt')}
                          </div>
                          <div className="text-xs text-ink-soft pt-1 font-sans">
                            {t(`wizard.quality.${tier}Desc`)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <p className="text-[11px] text-ink-soft leading-relaxed">
                  {t('wizard.quality.note')}
                </p>
              </div>

              {/* Structure & finishes 2x2 grid */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-4">
                <h2 className="font-headline text-lg font-bold text-ink">
                  {t('wizard.sections.structure')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="structuralSystem" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.structuralSystem')}
                    </label>
                    <select
                      id="structuralSystem"
                      value={form.structuralSystem}
                      onChange={(e) =>
                        setForm({ ...form, structuralSystem: e.target.value as ConstructionType })
                      }
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      <option value="rcc_framed">
                        {t('enum.construction.rcc_framed')}
                      </option>
                      <option value="load_bearing">
                        {t('enum.construction.load_bearing')}
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="walling" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.walling')}
                    </label>
                    <select
                      id="walling"
                      value={form.walling}
                      onChange={(e) => setForm({ ...form, walling: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      {WALLING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(`wizard.options.walling.${option}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="flooring" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.flooring')}
                    </label>
                    <select
                      id="flooring"
                      value={form.flooring}
                      onChange={(e) => setForm({ ...form, flooring: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      {FLOORING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(`wizard.options.flooring.${option}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="windows" className="block text-xs font-medium text-ink">
                      {t('wizard.fields.windows')}
                    </label>
                    <select
                      id="windows"
                      value={form.windows}
                      onChange={(e) => setForm({ ...form, windows: e.target.value })}
                      className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-sm text-ink focus-ring font-sans"
                    >
                      {WINDOWS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(`wizard.options.windows.${option}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-ink-soft leading-relaxed">
                  {t('wizard.hints.structure')}
                </p>
              </div>

              {/* What this budget covers */}
              <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-5 sm:p-6 space-y-3">
                <h2 className="font-headline text-lg font-bold text-ink">
                  {t('wizard.sections.coverage')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-forest font-semibold">
                      {t('wizard.coverage.includedTitle')}
                    </div>
                    <ul className="space-y-1.5 text-ink">
                      {['included1', 'included2', 'included3', 'included4'].map((key) => (
                        <li key={key} className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-forest" />
                          <span>{t(`wizard.coverage.${key}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-soft font-semibold">
                      {t('wizard.coverage.excludedTitle')}
                    </div>
                    <ul className="space-y-1.5 text-ink-soft">
                      {['excluded1', 'excluded2', 'excluded3', 'excluded4'].map((key) => (
                        <li key={key}>· {t(`wizard.coverage.${key}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-xs text-error space-y-1"
                >
                  <p className="font-semibold">{t('wizard.errors.calculateTitle')}</p>
                  <p>{submitError}</p>
                  {Object.entries(submitFieldErrors).length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5">
                      {Object.entries(submitFieldErrors).map(([field, message]) => (
                        <li key={field}>
                          <span className="font-mono">{field}</span>: {message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Form Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-ink/14 bg-paper hover:bg-paper-deep text-xs font-medium text-ink transition-colors focus-ring"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('wizard.actions.back')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={submitting}
                  aria-busy={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors focus-ring disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-paper/50 border-t-paper rounded-full animate-spin" aria-hidden="true" />
                      <span>{t('wizard.actions.calculating')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('wizard.actions.calculate')}</span>
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
                    {t('wizard.summary.ready')}
                  </span>
                  <SampleDataBadge text={t('common.sampleData')} variant="subtle" />
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-headline text-lg font-bold text-ink">
                    {form.projectName}
                  </h3>
                  <p className="text-xs text-ink-soft">{form.locality}, Pune</p>
                </div>

                <div className="space-y-2 text-xs font-sans border-t border-b border-ink/10 py-3">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{t('wizard.summary.building')}</span>
                    <span className="font-mono text-ink">
                      {t('wizard.summary.floorsValue', {
                        count: form.floors,
                        above: form.floors - 1,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{t('wizard.summary.totalBuiltUp')}</span>
                    <span className="font-mono text-ink">
                      {formatNumber(form.builtUpArea)} {t('common.sqFt')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{t('wizard.summary.plotArea')}</span>
                    <span className="font-mono text-ink">
                      {formatNumber(form.plotArea)} {t('common.sqFt')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{t('wizard.summary.quality')}</span>
                    <span className="font-semibold text-ink capitalize">
                      {t(`enum.quality.${form.qualityTier}`)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{t('wizard.summary.planningRate')}</span>
                    <span className="font-mono text-ink">
                      ₹{formatNumber(ratePerSqFt)} / {t('common.sqFt')}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-ink-soft pt-1 border-t border-ink/10">
                    {t('wizard.summary.formula', {
                      area: formatNumber(form.builtUpArea),
                      rate: formatNumber(ratePerSqFt),
                    })}
                  </div>
                </div>

                {/* Big Indicative Total in Card */}
                <div className="space-y-1">
                  <div className="font-headline text-3xl font-bold text-brick tracking-tight">
                    {formatINR(calculatedTotal)}
                  </div>
                  <p className="text-[11px] text-ink-soft">{t('wizard.summary.totalNote')}</p>
                </div>
              </div>

              {/* A sound starting assumption callout */}
              <div className="bg-clay/50 border border-ink/14 rounded-lg p-4 space-y-1.5 text-xs">
                <div className="font-semibold text-ink font-sans flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-forest" />
                  <span>{t('wizard.summary.assumptionTitle')}</span>
                </div>
                <p className="text-ink-soft leading-relaxed">
                  {t('wizard.summary.assumptionBody')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

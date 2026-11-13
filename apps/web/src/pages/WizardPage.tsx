import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { calculateEstimateMock } from '../services/mockApi';
import {
  apiClient,
  ApiError,
  isMockApi,
  mapZoneToRatesZone,
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
  const reduceMotion = useReducedMotion();
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
    zone_id: mapZoneToRatesZone(form.zoneId),
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
      <div className="app-surface flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <ErrorState message={optionsError} onRetry={loadOptions} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-surface flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-xs font-semibold text-ink-soft">{t('wizard.loading')}</span>
      </div>
    );
  }

  const stepLabels = [
    t('wizard.steps.projectSite'),
    t('wizard.steps.preferences'),
    t('wizard.steps.estimate'),
  ];

  return (
    <div className="app-surface min-h-screen pb-20 pt-6 text-ink">
      <div className="mx-auto max-w-shell space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Heading + stepper */}
        <header className="max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow text-accent">{t('wizard.kicker', { step })}</span>
            <SampleDataBadge text={t('common.sampleData')} />
          </div>

          <h1 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.055em] text-ink sm:text-4xl lg:text-5xl">
            {step === 1 ? t('wizard.headings.step1') : t('wizard.headings.step2')}
          </h1>

          <p className="text-sm leading-6 text-ink-soft">
            {step === 1 ? t('wizard.subtitles.step1') : t('wizard.subtitles.step2')}
          </p>

          <div className="flex items-center gap-1.5 pt-2 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 transition-colors ${
                step === 1 ? 'bg-accent-soft text-accent-deep' : 'text-ink-soft hover:bg-paper-deep'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                  step === 1 ? 'bg-accent text-white' : 'bg-night text-white'
                }`}
              >
                1
              </span>
              <span>{stepLabels[0]}</span>
            </button>
            <span aria-hidden="true" className="px-0.5 text-ink-soft/50">
              ›
            </span>
            <button
              type="button"
              onClick={() => validateStep1() && setStep(2)}
              className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 transition-colors ${
                step === 2 ? 'bg-accent-soft text-accent-deep' : 'text-ink-soft hover:bg-paper-deep'
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                  step === 2 ? 'bg-accent text-white' : 'bg-night text-white'
                }`}
              >
                2
              </span>
              <span>{stepLabels[1]}</span>
            </button>
            <span aria-hidden="true" className="px-0.5 text-ink-soft/50">
              ›
            </span>
            <span className="flex items-center gap-1.5 py-1 pl-1 pr-3 text-ink-soft/70">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-line text-[10px] font-bold">
                3
              </span>
              <span>{stepLabels[2]}</span>
            </span>
          </div>
        </header>

        {/* ================= STEP 1: PROJECT & SITE ================= */}
        {step === 1 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
            className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
          >
            {/* Left form column */}
            <div className="space-y-5 lg:col-span-8">
              {/* Project & location */}
              <section className="surface-card p-6">
                <h2 className="section-title">{t('wizard.sections.projectLocation')}</h2>

                <div className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="projectName" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.projectName')}
                    </label>
                    <input
                      id="projectName"
                      type="text"
                      value={form.projectName}
                      onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                      className={`field-input h-11 ${errors.projectName ? 'border-error ring-2 ring-error/15' : ''}`}
                      placeholder={t('wizard.fields.projectNamePlaceholder')}
                    />
                    {errors.projectName && (
                      <p className="text-[11px] font-semibold text-error">{errors.projectName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="city" className="block text-xs font-semibold text-ink">
                          {t('wizard.fields.city')}
                        </label>
                        <span className="rounded bg-paper-deep px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                          {t('wizard.fields.fixedRegion')}
                        </span>
                      </div>
                      <input
                        id="city"
                        type="text"
                        disabled
                        value={form.city}
                        className="field-input h-11 cursor-not-allowed bg-paper-deep/60 text-ink-soft"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="locality" className="block text-xs font-semibold text-ink">
                        {t('wizard.fields.locality')}
                      </label>
                      <select
                        id="locality"
                        value={form.locality}
                        onChange={(e) => setForm({ ...form, locality: e.target.value })}
                        className="field-input h-11"
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
                    <label htmlFor="zone" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.zone')}
                    </label>
                    <select
                      id="zone"
                      value={form.zoneId}
                      onChange={(e) => {
                        setForm({ ...form, zoneId: e.target.value });
                        if (e.target.value) setErrors({ ...errors, zoneId: '' });
                      }}
                      className={`field-input h-11 ${errors.zoneId ? 'border-error ring-2 ring-error/15' : ''}`}
                    >
                      <option value="">{t('wizard.fields.zonePlaceholder')}</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {t(`enum.zones.${zone.id}`, { defaultValue: zone.name })}
                        </option>
                      ))}
                    </select>
                    {errors.zoneId ? (
                      <p className="text-[11px] font-semibold text-error">{errors.zoneId}</p>
                    ) : (
                      <p className="text-[11px] text-ink-soft">{t('wizard.hints.zone')}</p>
                    )}
                  </div>

                  <p className="text-[11px] leading-5 text-ink-soft">
                    {t('wizard.hints.planningAssumption')}
                  </p>
                </div>
              </section>

              {/* Area & floors */}
              <section className="surface-card p-6">
                <h2 className="section-title">{t('wizard.sections.areaFloors')}</h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="builtUpArea" className="block text-xs font-semibold text-ink">
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
                        className={`field-input h-11 pr-16 ${errors.builtUpArea ? 'border-error ring-2 ring-error/15' : ''}`}
                      />
                      <span className="pointer-events-none absolute right-3.5 top-3 text-[11px] font-semibold text-ink-soft">
                        {t('common.sqFt')}
                      </span>
                    </div>
                    {errors.builtUpArea ? (
                      <p className="text-[11px] font-semibold text-error">{errors.builtUpArea}</p>
                    ) : (
                      <p className="text-[11px] text-ink-soft">{t('wizard.hints.addAllFloors')}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="plotArea" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.plotArea')}
                    </label>
                    <div className="relative">
                      <input
                        id="plotArea"
                        type="number"
                        value={form.plotArea || ''}
                        onChange={(e) => setForm({ ...form, plotArea: Number(e.target.value) })}
                        className="field-input h-11 pr-16"
                      />
                      <span className="pointer-events-none absolute right-3.5 top-3 text-[11px] font-semibold text-ink-soft">
                        {t('common.sqFt')}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-soft">{t('wizard.hints.plotOptional')}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="floors" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.floors')}
                    </label>
                    <select
                      id="floors"
                      value={form.floors}
                      onChange={(e) => setForm({ ...form, floors: Number(e.target.value) })}
                      className="field-input h-11"
                    >
                      {FLOOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(`wizard.floors.${option.key}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.approxPerFloor')}
                    </span>
                    <div className="flex h-11 items-center justify-between gap-2 rounded-lg border border-line bg-paper-deep/50 px-3.5 text-sm">
                      <span className="font-semibold text-ink">
                        {formatNumber(approxPerFloor)} {t('common.sqFt')}
                      </span>
                      <span className="text-[10px] text-ink-soft">
                        {t('wizard.floors.perFloorFormula', {
                          count: form.floors,
                          area: formatNumber(form.builtUpArea),
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="bedrooms" className="block text-xs font-semibold text-ink">
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
                      className={`field-input h-11 ${errors.bedrooms ? 'border-error ring-2 ring-error/15' : ''}`}
                    />
                    {errors.bedrooms && (
                      <p className="text-[11px] font-semibold text-error">{errors.bedrooms}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="bathrooms" className="block text-xs font-semibold text-ink">
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
                      className={`field-input h-11 ${errors.bathrooms ? 'border-error ring-2 ring-error/15' : ''}`}
                    />
                    {errors.bathrooms && (
                      <p className="text-[11px] font-semibold text-error">{errors.bathrooms}</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-accent/15 bg-accent-soft/60 p-4 text-xs leading-6 text-ink-soft">
                  <Info className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                  <p>
                    <strong className="font-bold text-ink">{t('wizard.areaCallout.title')}</strong>{' '}
                    {t('wizard.areaCallout.body', {
                      plot: formatNumber(form.plotArea),
                      built: formatNumber(form.builtUpArea),
                    })}
                  </p>
                </div>
              </section>

              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <span className="text-[11px] text-ink-soft">{t('wizard.requiredNote')}</span>
                <button type="button" onClick={handleNextStep} className="btn-primary w-full sm:w-auto">
                  <span>{t('wizard.actions.continue')}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right information panel */}
            <aside className="space-y-5 lg:col-span-4">
              <section className="surface-card p-6">
                <h2 className="section-title">{t('wizard.side.measureTitle')}</h2>
                <div className="mt-4">
                  <HouseSchematic
                    groundArea={`${formatNumber(approxPerFloor)} ${t('common.sqFt')}`}
                    firstFloorArea={`${formatNumber(approxPerFloor)} ${t('common.sqFt')}`}
                    totalArea={`${formatNumber(form.builtUpArea)} ${t('common.sqFt')}`}
                  />
                </div>
                <p className="mt-4 border-t border-line-soft pt-4 text-[11px] leading-5 text-ink-soft">
                  {t('wizard.side.measureBody')}
                </p>
              </section>

              <section className="surface-card p-6">
                <h2 className="section-title">{t('wizard.side.nextTitle')}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{t('wizard.side.nextBody')}</p>
                <p className="mt-3 text-[11px] text-ink-soft">{t('wizard.side.nextNote')}</p>
              </section>
            </aside>
          </motion.div>
        )}

        {/* ================= STEP 2: CONSTRUCTION PREFERENCES ================= */}
        {step === 2 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' }}
            className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
          >
            {/* Left form column */}
            <div className="space-y-5 lg:col-span-8">
              {/* Construction quality */}
              <section className="surface-card p-6">
                <h2 className="section-title">{t('wizard.sections.quality')}</h2>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {QUALITY_ORDER.map((tier) => {
                    const selected = form.qualityTier === tier;
                    return (
                      <label
                        key={tier}
                        className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                          selected
                            ? 'border-accent bg-accent-tint ring-1 ring-accent'
                            : 'border-line bg-panel hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-soft'
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
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-ink">
                              {t(`enum.quality.${tier}`)}
                            </span>
                            {selected && (
                              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                                <Check className="h-3 w-3" aria-hidden="true" />
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-extrabold tracking-[-0.04em] text-ink">
                            {formatINR(QUALITY_RATES[tier])}
                          </div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
                            {t('wizard.quality.perSqFt')}
                          </div>
                          <div className="pt-1 text-[11px] leading-5 text-ink-soft">
                            {t(`wizard.quality.${tier}Desc`)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <p className="mt-4 text-[11px] leading-5 text-ink-soft">{t('wizard.quality.note')}</p>
              </section>

              {/* Structure & finishes */}
              <section className="surface-card p-6">
                <h2 className="section-title">{t('wizard.sections.structure')}</h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="structuralSystem" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.structuralSystem')}
                    </label>
                    <select
                      id="structuralSystem"
                      value={form.structuralSystem}
                      onChange={(e) =>
                        setForm({ ...form, structuralSystem: e.target.value as ConstructionType })
                      }
                      className="field-input h-11"
                    >
                      <option value="rcc_framed">{t('enum.construction.rcc_framed')}</option>
                      <option value="load_bearing">{t('enum.construction.load_bearing')}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="walling" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.walling')}
                    </label>
                    <select
                      id="walling"
                      value={form.walling}
                      onChange={(e) => setForm({ ...form, walling: e.target.value })}
                      className="field-input h-11"
                    >
                      {WALLING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(`wizard.options.walling.${option}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="flooring" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.flooring')}
                    </label>
                    <select
                      id="flooring"
                      value={form.flooring}
                      onChange={(e) => setForm({ ...form, flooring: e.target.value })}
                      className="field-input h-11"
                    >
                      {FLOORING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(`wizard.options.flooring.${option}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="windows" className="block text-xs font-semibold text-ink">
                      {t('wizard.fields.windows')}
                    </label>
                    <select
                      id="windows"
                      value={form.windows}
                      onChange={(e) => setForm({ ...form, windows: e.target.value })}
                      className="field-input h-11"
                    >
                      {WINDOWS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t(`wizard.options.windows.${option}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="mt-4 text-[11px] leading-5 text-ink-soft">{t('wizard.hints.structure')}</p>
              </section>

              {/* Coverage */}
              <section className="surface-card p-6">
                <h2 className="section-title">{t('wizard.sections.coverage')}</h2>

                <div className="mt-5 grid grid-cols-1 gap-6 text-xs sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                      {t('wizard.coverage.includedTitle')}
                    </div>
                    <ul className="space-y-2 text-ink">
                      {['included1', 'included2', 'included3', 'included4'].map((key) => (
                        <li key={key} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-accent" aria-hidden="true" />
                          <span className="leading-5">{t(`wizard.coverage.${key}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                      {t('wizard.coverage.excludedTitle')}
                    </div>
                    <ul className="space-y-2 leading-5 text-ink-soft">
                      {['excluded1', 'excluded2', 'excluded3', 'excluded4'].map((key) => (
                        <li key={key} className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-ink-soft/60">
                            ·
                          </span>
                          <span>{t(`wizard.coverage.${key}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {submitError && (
                <div
                  role="alert"
                  className="space-y-1 rounded-xl border border-error/30 bg-error/5 px-5 py-4 text-xs text-error"
                >
                  <p className="font-bold">{t('wizard.errors.calculateTitle')}</p>
                  <p>{submitError}</p>
                  {Object.entries(submitFieldErrors).length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-4">
                      {Object.entries(submitFieldErrors).map(([field, message]) => (
                        <li key={field}>
                          <span className="font-mono">{field}</span>: {message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost w-full sm:w-auto">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('wizard.actions.back')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={submitting}
                  aria-busy={submitting}
                  className="btn-primary w-full sm:w-auto"
                >
                  {submitting ? (
                    <>
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                        aria-hidden="true"
                      />
                      <span>{t('wizard.actions.calculating')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('wizard.actions.calculate')}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right summary panel */}
            <aside className="space-y-5 lg:col-span-4">
              <section className="surface-card p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-accent-deep">
                    {t('wizard.summary.ready')}
                  </span>
                  <SampleDataBadge text={t('common.sampleData')} variant="subtle" />
                </div>

                <div className="mt-4 space-y-0.5">
                  <h2 className="text-xl font-extrabold tracking-[-0.04em] text-ink">
                    {form.projectName}
                  </h2>
                  <p className="text-xs text-ink-soft">
                    {form.locality}, Pune
                  </p>
                </div>

                <dl className="mt-4 space-y-2.5 border-y border-line-soft py-4 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t('wizard.summary.building')}</dt>
                    <dd className="font-semibold text-ink">
                      {t('wizard.summary.floorsValue', {
                        count: form.floors,
                        above: form.floors - 1,
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t('wizard.summary.totalBuiltUp')}</dt>
                    <dd className="font-semibold text-ink">
                      {formatNumber(form.builtUpArea)} {t('common.sqFt')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t('wizard.summary.plotArea')}</dt>
                    <dd className="font-semibold text-ink">
                      {formatNumber(form.plotArea)} {t('common.sqFt')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t('wizard.summary.quality')}</dt>
                    <dd className="font-semibold capitalize text-ink">
                      {t(`enum.quality.${form.qualityTier}`)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">{t('wizard.summary.planningRate')}</dt>
                    <dd className="font-semibold text-ink">
                      ₹{formatNumber(ratePerSqFt)} / {t('common.sqFt')}
                    </dd>
                  </div>
                  <div className="pt-2 text-[10px] text-ink-soft">
                    {t('wizard.summary.formula', {
                      area: formatNumber(form.builtUpArea),
                      rate: formatNumber(ratePerSqFt),
                    })}
                  </div>
                </dl>

                <div className="mt-4 rounded-xl bg-night p-5 text-white">
                  <p className="text-[28px] font-extrabold leading-none tracking-[-0.05em]">
                    {formatINR(calculatedTotal)}
                  </p>
                  <p className="mt-2 text-[11px] text-white/55">{t('wizard.summary.totalNote')}</p>
                </div>
              </section>

              <section className="rounded-xl border border-accent/15 bg-accent-soft/60 p-5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <Info className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>{t('wizard.summary.assumptionTitle')}</span>
                </div>
                <p className="mt-2 leading-6 text-ink-soft">{t('wizard.summary.assumptionBody')}</p>
              </section>
            </aside>
          </motion.div>
        )}
      </div>
    </div>
  );
}

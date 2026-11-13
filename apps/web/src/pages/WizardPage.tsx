import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { formatINR } from '../lib/formatters';
import { ProductHeader } from '../components/layout/ProductHeader';
import { Glyph } from '../components/common/Glyph';

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
      <main className="product-page wizard-page">
        <ProductHeader active="estimate" />
        <section className="wizard-content">
          <div role="alert" className="mt-8 rounded-lg border border-error/30 bg-error/10 p-6 text-center text-error">
            <p className="font-semibold">{optionsError}</p>
            <button
              type="button"
              onClick={loadOptions}
              className="mt-3 px-4 py-2 rounded-md bg-white text-error border border-error/40 font-medium text-xs hover:bg-error/5"
            >
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="product-page wizard-page">
        <ProductHeader active="estimate" />
        <section className="wizard-content py-20 text-center text-ink-soft text-sm">
          {t('wizard.loading')}
        </section>
      </main>
    );
  }

  return (
    <main className="product-page wizard-page">
      <ProductHeader active="estimate" />
      <section className="wizard-content">
        <Link to="/app" className="wizard-back">
          ← Back to projects
        </Link>
        <div className="wizard-title">
          <p className="app-eyebrow">New residential estimate</p>
          <h1>Set up your project.</h1>
          <p>Start with the size and quality of the home you’re planning.</p>
        </div>
        <div className="progress-stepper">
          {[
            ['1', 'Setup'],
            ['2', 'Specifications'],
            ['3', 'Results'],
          ].map(([number, label], index) => {
            const isCurrent = (index === 0 && step === 1) || (index === 1 && step === 2);
            return (
              <div className={isCurrent ? 'current' : ''} key={number}>
                <span>{number}</span>
                <strong>{label}</strong>
                {index < 2 && <i />}
              </div>
            );
          })}
        </div>

        <section className="wizard-card">
          {step === 1 ? (
            <>
              <div className="wizard-card-heading">
                <span>
                  <Glyph name="home" />
                </span>
                <div>
                  <p className="app-eyebrow">Step 01</p>
                  <h2>Home size and site setup</h2>
                  <p>Use approximate measurements for your first planning estimate.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.projectName')}</span>
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                    placeholder={t('wizard.fields.projectNamePlaceholder')}
                  />
                  {errors.projectName && (
                    <p className="mt-1 text-[11px] font-semibold text-error">{errors.projectName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="locality" className="block text-xs font-semibold text-ink">
                      <span>{t('wizard.fields.locality')}</span>
                    </label>
                    <select
                      id="locality"
                      value={form.locality}
                      onChange={(e) => setForm({ ...form, locality: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                    >
                      {LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="zoneId" className="block text-xs font-semibold text-ink">
                      <span>Location zone</span>
                    </label>
                    <select
                      id="zoneId"
                      value={form.zoneId}
                      onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                    >
                      <option value="" disabled>
                        Select zone
                      </option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    {errors.zoneId && (
                      <p className="mt-1 text-[11px] font-semibold text-error">{errors.zoneId}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="wizard-control mt-6">
                <label htmlFor="builtUpArea">
                  <span>Built-up area</span>
                  <strong className="mono">{form.builtUpArea.toLocaleString('en-IN')} sq ft</strong>
                </label>
                <input
                  id="builtUpArea"
                  type="range"
                  min="600"
                  max="5000"
                  step="100"
                  value={form.builtUpArea}
                  onChange={(event) => setForm({ ...form, builtUpArea: Number(event.target.value) })}
                  style={
                    {
                      '--wizard-range': `${((form.builtUpArea - 600) / 4400) * 100}%`,
                    } as React.CSSProperties
                  }
                />
                <div className="wizard-scale">
                  <span>600 sq ft</span>
                  <span>Typical Pune home: 1,200–2,400 sq ft</span>
                  <span>5,000 sq ft</span>
                </div>
                {errors.builtUpArea && (
                  <p className="mt-1 text-[11px] font-semibold text-error">{errors.builtUpArea}</p>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label htmlFor="floors" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.floors')}</span>
                  </label>
                  <select
                    id="floors"
                    value={form.floors}
                    onChange={(e) => setForm({ ...form, floors: Number(e.target.value) })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  >
                    {FLOOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value === 1 ? 'Ground floor only' : `G+${opt.value - 1} (${opt.value} floors)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="bedrooms" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.bedrooms')}</span>
                  </label>
                  <input
                    id="bedrooms"
                    type="number"
                    min="1"
                    max="10"
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.bathrooms')}</span>
                  </label>
                  <input
                    id="bathrooms"
                    type="number"
                    min="1"
                    max="10"
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="plotArea" className="block text-xs font-semibold text-ink">
                    <span>Plot area (optional)</span>
                  </label>
                  <input
                    id="plotArea"
                    type="number"
                    value={form.plotArea || ''}
                    onChange={(e) => setForm({ ...form, plotArea: Number(e.target.value) })}
                    placeholder="1200"
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="wizard-footer">
                <div>
                  <span>Indicative planning total</span>
                  <strong className="mono">{formatINR(calculatedTotal)}</strong>
                </div>
                <button type="button" onClick={handleNextStep} className="cobalt-button">
                  {t('wizard.actions.continue')} <Glyph name="arrow" size={17} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="wizard-card-heading">
                <span>
                  <Glyph name="chart" />
                </span>
                <div>
                  <p className="app-eyebrow">Step 02</p>
                  <h2>Quality and material specifications</h2>
                  <p>Choose the specification level that best reflects your material expectations.</p>
                </div>
              </div>

              <fieldset className="wizard-quality">
                <legend>Construction quality</legend>
                <p>Choose the specification level that best reflects your material expectations.</p>
                <div>
                  {QUALITY_ORDER.map((tierKey, index) => {
                    const item =
                      tierKey === 'economy' ? 'Economy' : tierKey === 'standard' ? 'Standard' : 'Premium';
                    const isSelected = form.qualityTier === tierKey;
                    return (
                      <button
                        type="button"
                        className={isSelected ? 'selected' : ''}
                        key={tierKey}
                        onClick={() => setForm({ ...form, qualityTier: tierKey })}
                      >
                        <span className="quality-check">
                          {isSelected && <Glyph name="check" size={13} />}
                        </span>
                        <small>0{index + 1}</small>
                        <strong>{item}</strong>
                        <span className="mono">₹{QUALITY_RATES[tierKey].toLocaleString('en-IN')}/sq ft</span>
                        <p>
                          {tierKey === 'economy'
                            ? 'Practical essentials and durable base finishes.'
                            : tierKey === 'standard'
                              ? 'Balanced quality for a comfortable family home.'
                              : 'Upgraded finishes, fixtures, and detailing.'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="structuralSystem" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.constructionType')}</span>
                  </label>
                  <select
                    id="structuralSystem"
                    value={form.structuralSystem}
                    onChange={(e) =>
                      setForm({ ...form, structuralSystem: e.target.value as ConstructionType })
                    }
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  >
                    <option value="rcc_framed">{t('wizard.options.construction.rcc_framed')}</option>
                    <option value="load_bearing">{t('wizard.options.construction.load_bearing')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="walling" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.walling')}</span>
                  </label>
                  <select
                    id="walling"
                    value={form.walling}
                    onChange={(e) => setForm({ ...form, walling: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  >
                    {WALLING_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`wizard.options.walling.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="flooring" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.flooring')}</span>
                  </label>
                  <select
                    id="flooring"
                    value={form.flooring}
                    onChange={(e) => setForm({ ...form, flooring: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  >
                    {FLOORING_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`wizard.options.flooring.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="windows" className="block text-xs font-semibold text-ink">
                    <span>{t('wizard.fields.windows')}</span>
                  </label>
                  <select
                    id="windows"
                    value={form.windows}
                    onChange={(e) => setForm({ ...form, windows: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink outline-none focus:border-accent"
                  >
                    {WINDOWS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`wizard.options.windows.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="mt-6 space-y-1 rounded-xl border border-error/30 bg-error/5 px-5 py-4 text-xs text-error"
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

              <div className="wizard-footer">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="wizard-back text-xs font-semibold text-ink-soft hover:text-ink"
                >
                  ← Back to project details
                </button>
                <div>
                  <span>Indicative planning total</span>
                  <strong className="mono">{formatINR(calculatedTotal)}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleCalculate}
                  disabled={submitting}
                  aria-busy={submitting}
                  className="cobalt-button"
                >
                  {submitting ? t('wizard.actions.calculating') : t('wizard.actions.calculate')}{' '}
                  <Glyph name="arrow" size={17} />
                </button>
              </div>
            </>
          )}
        </section>
        <p className="wizard-disclaimer">
          This is an indicative planning estimate, not a contractor quotation.
        </p>
      </section>
    </main>
  );
}

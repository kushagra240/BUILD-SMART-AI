import posthog from 'posthog-js';

export const POSTHOG_KEY =
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ||
  'phc_placeholder_buildsmart_ai_2026';

export const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
  'https://us.i.posthog.com';

export function isAnalyticsActive(): boolean {
  if (
    import.meta.env.DEV ||
    import.meta.env.MODE === 'development' ||
    import.meta.env.MODE === 'test'
  ) {
    return false;
  }
  return true;
}

export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  const active = isAnalyticsActive();

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: active,
    capture_pageview: active,
    disable_session_recording: !active,
    opt_out_capturing_by_default: !active,
    loaded: (ph) => {
      if (!active) {
        ph.opt_out_capturing();
      }
    },
  });

  if (!active) {
    posthog.opt_out_capturing();
  }
}

export interface EstimateCalculatedEvent {
  estimate_id: string;
  project_id?: string;
  total_p50: number;
  quality_tier: string;
  zone_id: string;
  built_up_area_sqft: number;
  is_mock?: boolean;
}

export interface PdfDownloadEvent {
  project_id: string;
  estimate_id: string;
}

export interface CsvDownloadEvent {
  project_id?: string;
  estimate_id: string;
  total_p50?: number;
}

export function trackEstimateCalculated(props: EstimateCalculatedEvent): void {
  try {
    if (!isAnalyticsActive()) return;
    posthog.capture('estimate_calculated', { ...props });
  } catch {
    // Non-blocking
  }
}

export function trackPdfDownload(props: PdfDownloadEvent): void {
  try {
    if (!isAnalyticsActive()) return;
    posthog.capture('estimate_pdf_downloaded', { ...props });
  } catch {
    // Non-blocking
  }
}

export function trackCsvDownload(props: CsvDownloadEvent): void {
  try {
    if (!isAnalyticsActive()) return;
    posthog.capture('estimate_csv_downloaded', { ...props });
  } catch {
    // Non-blocking
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  try {
    if (!isAnalyticsActive()) return;
    posthog.capture(name, props);
  } catch {
    // Non-blocking
  }
}

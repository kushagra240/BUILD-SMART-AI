import { describe, it, expect, vi, beforeEach } from 'vitest';
import posthog from 'posthog-js';
import {
  initAnalytics,
  isAnalyticsActive,
  trackEstimateCalculated,
  trackPdfDownload,
  trackCsvDownload,
  trackEvent,
  POSTHOG_KEY,
  POSTHOG_HOST,
} from './analytics';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}));

describe('analytics service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes valid placeholder or configured key and host', () => {
    expect(POSTHOG_KEY).toBeTruthy();
    expect(POSTHOG_HOST).toBeTruthy();
  });

  it('detects dev/test mode as inactive', () => {
    // In vitest, MODE is 'test'
    expect(isAnalyticsActive()).toBe(false);
  });

  it('initializes posthog and opts out when in dev/test mode', () => {
    initAnalytics();
    expect(posthog.init).toHaveBeenCalledWith(
      POSTHOG_KEY,
      expect.objectContaining({
        api_host: POSTHOG_HOST,
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
      })
    );
    expect(posthog.opt_out_capturing).toHaveBeenCalled();
  });

  it('does not send network events when analytics is inactive in dev/test', () => {
    trackEstimateCalculated({
      estimate_id: 'est-123',
      total_p50: 2500000,
      quality_tier: 'standard',
      zone_id: 'pune_central',
      built_up_area_sqft: 1200,
    });
    expect(posthog.capture).not.toHaveBeenCalled();

    trackPdfDownload({
      project_id: 'proj-123',
      estimate_id: 'est-123',
    });
    expect(posthog.capture).not.toHaveBeenCalled();

    trackCsvDownload({
      estimate_id: 'est-123',
    });
    expect(posthog.capture).not.toHaveBeenCalled();

    trackEvent('custom_event', { foo: 'bar' });
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('handles posthog capture exceptions gracefully without throwing', () => {
    // Force capture to throw if called
    vi.mocked(posthog.capture).mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    expect(() => {
      trackEvent('failing_event');
    }).not.toThrow();
  });
});

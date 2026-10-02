import { describe, it, expect } from 'vitest';
import { fetchMetaOptions, calculateEstimateMock } from './mockApi';
import { ProjectInputs } from '../types/estimate';

describe('mockApi', () => {
  it('returns meta options tagged as mock', async () => {
    const meta = await fetchMetaOptions();
    expect(meta.is_mock).toBe(true);
    expect(meta.zones.length).toBeGreaterThan(0);
    expect(meta.quality_tiers.length).toBe(3);
  });

  it('calculates estimate response where breakdown categories sum exactly to total.p50', async () => {
    const inputs: ProjectInputs = {
      built_up_area_sqft: 1800,
      floors: 2,
      bedrooms: 3,
      bathrooms: 3,
      zone_id: 'pune_west',
      quality_tier: 'standard',
      construction_type: 'rcc_framed',
      budget_inr: 3500000,
    };

    const estimate = await calculateEstimateMock(inputs);
    expect(estimate.is_mock).toBe(true);
    expect(estimate.total.p50).toBeGreaterThan(0);
    expect(estimate.total.p10).toBeLessThan(estimate.total.p50);
    expect(estimate.total.p90).toBeGreaterThan(estimate.total.p50);

    // Sum check on category breakdown
    const categorySum = estimate.breakdown.reduce((acc, cat) => acc + cat.amount, 0);
    expect(categorySum).toEqual(estimate.total.p50);
  });
});

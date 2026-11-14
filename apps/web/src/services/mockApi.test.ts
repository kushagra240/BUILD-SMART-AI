import { describe, it, expect } from 'vitest';
import { fetchMetaOptions, calculateEstimateMock, MOCK_META_OPTIONS } from './mockApi';
import { ProjectInputs } from '../types/estimate';
import { ESTIMATE_CATEGORIES } from '../domain/estimateCategories';

const baseInputs: ProjectInputs = {
  built_up_area_sqft: 1800,
  floors: 2,
  bedrooms: 3,
  bathrooms: 3,
  zone_id: 'pune_west',
  quality_tier: 'standard',
  construction_type: 'rcc_framed',
  budget_inr: 3500000,
};

describe('mockApi', () => {
  it('returns meta options tagged as mock', async () => {
    const meta = await fetchMetaOptions();
    expect(meta.is_mock).toBe(true);
    expect(meta.zones.length).toBeGreaterThan(0);
    expect(meta.quality_tiers.length).toBe(3);
  });

  it('uses ids that match the OpenAPI MetaOptionsResponse shape', async () => {
    const meta = await fetchMetaOptions();
    for (const zone of meta.zones) {
      expect(zone).toMatchObject({ id: expect.any(String), name: expect.any(String) });
    }
    for (const tier of meta.quality_tiers) {
      expect(tier).toMatchObject({ id: expect.any(String), name: expect.any(String) });
    }
    for (const type of meta.construction_types) {
      expect(type).toMatchObject({ id: expect.any(String), name: expect.any(String) });
    }
  });

  it('emits the canonical nine categories with shares summing to exactly 100', async () => {
    const estimate = await calculateEstimateMock(baseInputs);

    expect(estimate.breakdown.map((row) => row.category)).toEqual(
      ESTIMATE_CATEGORIES.map((category) => category.value)
    );
    const shareSum = estimate.breakdown.reduce((acc, row) => acc + row.share_pct, 0);
    expect(shareSum).toBe(100);
  });

  it('derives the rate from MOCK_META_OPTIONS rather than a second table', async () => {
    const estimate = await calculateEstimateMock({
      ...baseInputs,
      built_up_area_sqft: 1000,
      floors: 1,
      zone_id: 'pune_central',
      quality_tier: 'standard',
    });

    const standard = MOCK_META_OPTIONS.quality_tiers.find((tier) => tier.id === 'standard');
    expect(standard?.indicative_rate_sqft).toBeDefined();
    expect(estimate.total.p50).toBe(
      1000 * Math.round((standard?.indicative_rate_sqft ?? 0) * 1.08)
    );
  });

  it('fails loudly when a tier has no rate instead of falling back', async () => {
    await expect(
      calculateEstimateMock({
        ...baseInputs,
        quality_tier: 'unknown' as ProjectInputs['quality_tier'],
      })
    ).rejects.toThrow(/no indicative rate for quality tier/);
  });

  it('calculates estimate response where breakdown categories sum exactly to total.p50', async () => {
    const estimate = await calculateEstimateMock(baseInputs);
    expect(estimate.is_mock).toBe(true);
    expect(estimate.total.p50).toBeGreaterThan(0);
    expect(estimate.total.p10).toBeLessThan(estimate.total.p50);
    expect(estimate.total.p90).toBeGreaterThan(estimate.total.p50);

    // Sum check on category breakdown
    const categorySum = estimate.breakdown.reduce((acc, cat) => acc + cat.amount, 0);
    expect(categorySum).toEqual(estimate.total.p50);
  });
});

import { describe, expect, it } from 'vitest';
import { ESTIMATE_CATEGORIES, categoryChartColor } from './estimateCategories';

describe('estimateCategories', () => {
  it('defines the nine contract categories exactly once', () => {
    expect(ESTIMATE_CATEGORIES).toHaveLength(9);
    const values = ESTIMATE_CATEGORIES.map((category) => category.value);
    expect(new Set(values).size).toBe(9);
    expect(values).toEqual([
      'Foundation',
      'Structure',
      'Masonry',
      'Roofing',
      'Flooring',
      'Plumbing',
      'Electrical',
      'Finishing',
      'Labour',
    ]);
  });

  it('has a planning allocation that sums to exactly 100', () => {
    const total = ESTIMATE_CATEGORIES.reduce((sum, category) => sum + category.sharePct, 0);
    expect(total).toBe(100);
  });

  it('gives every category a distinct chart colour', () => {
    const colours = ESTIMATE_CATEGORIES.map((category) => category.chartColor);
    expect(new Set(colours).size).toBe(colours.length);
  });

  it('resolves a category colour regardless of case and falls back by position', () => {
    expect(categoryChartColor('structure')).toBe('#315EFB');
    expect(categoryChartColor('  Foundation ')).toBe('#151820');
    expect(categoryChartColor('Unknown category', 0)).toBe('#151820');
  });
});

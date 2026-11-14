/**
 * The single source of truth for the nine estimate categories.
 *
 * `value` is the exact English string the backend engine returns
 * (`apps/api/app/engine/calculator.py::CATEGORIES`), so the mock layer and the
 * results view can never drift from the API contract. `key` is the matching
 * `enum.categories.<key>` translation segment. `sharePct` is the mock planning
 * allocation and must sum to exactly 100; it is also the illustrative split
 * shown on the methodology page. `chartColor` is the results palette entry.
 */
export interface EstimateCategory {
  /** Exact category string returned by `GET /projects/{id}/estimates`. */
  value: string;
  /** Segment under `enum.categories` in the i18n dictionaries. */
  key: string;
  /** Mock allocation percentage. The nine values must sum to 100. */
  sharePct: number;
  /** Results chart colour keyed to the contract value. */
  chartColor: string;
}

export const ESTIMATE_CATEGORIES: readonly EstimateCategory[] = [
  { value: 'Foundation', key: 'foundation', sharePct: 11, chartColor: '#151820' },
  { value: 'Structure', key: 'structure', sharePct: 28, chartColor: '#315EFB' },
  { value: 'Masonry', key: 'masonry', sharePct: 11, chartColor: '#6685F4' },
  { value: 'Roofing', key: 'roofing', sharePct: 5, chartColor: '#2455E6' },
  { value: 'Flooring', key: 'flooring', sharePct: 10, chartColor: '#8FA8F5' },
  { value: 'Plumbing', key: 'plumbing', sharePct: 7, chartColor: '#8F98A8' },
  { value: 'Electrical', key: 'electrical', sharePct: 7, chartColor: '#B7C2D8' },
  { value: 'Finishing', key: 'finishing', sharePct: 10, chartColor: '#5C6470' },
  { value: 'Labour', key: 'labour', sharePct: 11, chartColor: '#AFC4FB' },
] as const;

const CATEGORY_BY_VALUE = new Map(
  ESTIMATE_CATEGORIES.map((category) => [category.value.toLowerCase(), category])
);

const CHART_RAMP = ESTIMATE_CATEGORIES.map((category) => category.chartColor);

/**
 * Colour for a category returned by the API. Unknown categories fall back to
 * the shared ramp by position so a new backend category is still legible and
 * never silently reuses another category's colour.
 */
export function categoryChartColor(value: string, index = 0): string {
  const known = CATEGORY_BY_VALUE.get(value.trim().toLowerCase());
  return known?.chartColor ?? CHART_RAMP[index % CHART_RAMP.length];
}

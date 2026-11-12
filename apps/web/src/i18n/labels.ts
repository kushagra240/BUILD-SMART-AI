import type { TFunction } from 'i18next';

/**
 * Translates fixed, contract-level enum values returned by the API.
 *
 * Only values that are part of the frozen frontend contract are translated.
 * Anything unknown (a new backend value, or free-text supplied by the API such
 * as material reasons and disclaimers) falls back to the raw value so the UI
 * never invents a label.
 */
function translateFrom(
  t: TFunction,
  group: 'categories' | 'materialCategories' | 'construction' | 'quality' | 'zones' | 'budgetStatus',
  raw: string
): string {
  if (!raw) {
    return raw;
  }
  const key = `enum.${group}.${toKey(raw)}`;
  const translated = t(key, { defaultValue: '' });
  return translated === '' ? raw : translated;
}

/** Normalises an English contract value into a translation key segment. */
function toKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function translateCategory(t: TFunction, raw: string): string {
  return translateFrom(t, 'categories', raw);
}

export function translateMaterialCategory(t: TFunction, raw: string): string {
  return translateFrom(t, 'materialCategories', raw);
}

export function translateConstruction(t: TFunction, raw: string): string {
  return translateFrom(t, 'construction', raw);
}

export function translateQuality(t: TFunction, raw: string): string {
  return translateFrom(t, 'quality', raw);
}

export function translateZone(t: TFunction, raw: string): string {
  return translateFrom(t, 'zones', raw);
}

export function translateBudgetStatus(t: TFunction, raw: string): string {
  return translateFrom(t, 'budgetStatus', raw);
}

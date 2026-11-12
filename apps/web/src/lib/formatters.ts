/**
 * Indian Number Formatting Utilities.
 *
 * Values are always formatted with an Indian locale. The language only changes
 * the locale tag (and therefore month names and digit grouping where the
 * platform supports it), never the underlying numeric value.
 */
import i18n from '../i18n';

function currentLocale(): string {
  switch (i18n.language) {
    case 'hi':
      return 'hi-IN';
    case 'mr':
      return 'mr-IN';
    default:
      return 'en-IN';
  }
}

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatINRShorthand(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1_00_00_000) {
    const cr = (absAmount / 1_00_00_000).toFixed(2);
    return `${sign}₹${cr} ${i18n.t('common.crore', { defaultValue: 'Cr' })}`;
  } else if (absAmount >= 1_00_000) {
    const lakh = (absAmount / 1_00_000).toFixed(2);
    return `${sign}₹${lakh} ${i18n.t('common.lakh', { defaultValue: 'Lakh' })}`;
  }
  return formatINR(amount);
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat(currentLocale()).format(value);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(currentLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(currentLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

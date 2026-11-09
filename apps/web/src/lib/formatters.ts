/**
 * Indian Number Formatting Utilities (en-IN)
 */

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
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
    return `${sign}₹${cr} Cr`;
  } else if (absAmount >= 1_00_000) {
    const lakh = (absAmount / 1_00_000).toFixed(2);
    return `${sign}₹${lakh} Lakh`;
  }
  return formatINR(amount);
}

export function formatNumber(value: number): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-IN').format(value);
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_FORMATTER.format(date);
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return DATE_TIME_FORMATTER.format(date);
}

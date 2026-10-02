import { describe, it, expect } from 'vitest';
import { formatINR, formatINRShorthand, formatNumber } from './formatters';

describe('formatters', () => {
  it('formats currency in Indian Rupees (en-IN)', () => {
    const formatted = formatINR(3420000);
    expect(formatted).toContain('34,20,000');
    expect(formatted).toContain('₹');
  });

  it('formats shorthand amounts in Lakhs and Crores', () => {
    expect(formatINRShorthand(3420000)).toBe('₹34.20 Lakh');
    expect(formatINRShorthand(14500000)).toBe('₹1.45 Cr');
    expect(formatINRShorthand(45000)).toBe('₹45,000');
  });

  it('formats plain numbers in en-IN style', () => {
    expect(formatNumber(1800)).toBe('1,800');
    expect(formatNumber(100000)).toBe('1,00,000');
  });
});

import { describe, it, expect } from 'vitest';
import {
  formatPKR,
  formatCurrency,
  formatQuantity,
  formatDate,
  formatDateTime,
} from './formatters';

describe('formatPKR & formatCurrency', () => {
  it('formats positive currency amounts correctly', () => {
    expect(formatPKR(1250)).toBe('PKR 1,250.00');
    expect(formatPKR(1250.5)).toBe('PKR 1,250.50');
    expect(formatCurrency(1250)).toBe('Rs. 1,250.00');
  });

  it('formats negative currency amounts correctly', () => {
    expect(formatPKR(-500)).toBe('-PKR 500.00');
    expect(formatCurrency(-500)).toBe('-Rs. 500.00');
  });

  it('supports prefix="none"', () => {
    expect(formatPKR(9999.99, { prefix: 'none' })).toBe('9,999.99');
  });

  it('handles null, undefined and invalid numbers safely', () => {
    expect(formatPKR(null)).toBe('PKR 0.00');
    expect(formatPKR(undefined)).toBe('PKR 0.00');
    expect(formatPKR('abc')).toBe('PKR 0.00');
  });
});

describe('formatQuantity', () => {
  it('formats quantities with or without unit', () => {
    expect(formatQuantity(100)).toBe('100');
    expect(formatQuantity(100.5, 'boxes')).toBe('100.5 boxes');
    expect(formatQuantity(0, 'units')).toBe('0 units');
  });

  it('handles empty/invalid values gracefully', () => {
    expect(formatQuantity(null, 'packs')).toBe('0 packs');
  });
});

describe('formatDate', () => {
  it('formats standard ISO dates to DD/MM/YYYY', () => {
    const d = new Date(2026, 8, 12); // Sep 12, 2026
    expect(formatDate(d)).toBe('12/09/2026');
  });

  it('supports medium and iso styles', () => {
    const d = new Date(2026, 8, 12);
    expect(formatDate(d, { style: 'medium' })).toBe('12 Sept 2026'); // or '12 Sep 2026'
    expect(formatDate(d, { style: 'iso' })).toBe('2026-09-12');
  });

  it('handles null, empty, and invalid dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('invalid-date')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('formats dates with time', () => {
    const d = new Date(2026, 8, 12, 16, 30);
    const res = formatDateTime(d);
    expect(res).toContain('12/09/2026');
    expect(res).toMatch(/04:30\s*PM/i);
  });

  it('handles invalid dates safely', () => {
    expect(formatDateTime(null)).toBe('—');
  });
});

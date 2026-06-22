import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyCompact } from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats 1000 as ₹1,000', () => {
    expect(formatCurrency(1000)).toBe('₹1,000');
  });

  it('formats 100000 as ₹1,00,000 (Indian format)', () => {
    expect(formatCurrency(100000)).toBe('₹1,00,000');
  });

  it('formats 10000000 as ₹1,00,00,000', () => {
    expect(formatCurrency(10000000)).toBe('₹1,00,00,000');
  });

  it('formats 0 as ₹0', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('handles decimal amounts correctly', () => {
    expect(formatCurrency(1000.5)).toBe('₹1,000.5');
    expect(formatCurrency(1000.55)).toBe('₹1,000.55');
  });

  it('handles null or undefined input gracefully', () => {
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(undefined)).toBe('₹0');
  });
});

describe('formatCurrencyCompact', () => {
  it('formats large numbers correctly', () => {
    expect(formatCurrencyCompact(10000000)).toBe('₹1.0Cr');
    expect(formatCurrencyCompact(150000)).toBe('₹1.5L');
    expect(formatCurrencyCompact(2500)).toBe('₹2.5K');
    expect(formatCurrencyCompact(500)).toBe('₹500');
  });
});

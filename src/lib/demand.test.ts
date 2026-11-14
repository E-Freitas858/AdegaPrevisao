import { describe, it, expect } from 'vitest';
import { forecast, initialData, period, categories, validateWorkbook } from './demand';

describe('Workbook forecasting', () => {
  it('preserves the original historical revenue', () => {
    expect(forecast(initialData, 'Faturamento Bruto', 2023, 0)).toBe(72308.68);
  });
  it('preserves the workbook seasonal forecast for 2026', () => {
    expect(forecast(initialData, 'Faturamento Bruto', 2026, 0)).toBeCloseTo(68076.9457, 2);
  });
  it('extends linear trend and seasonality to 2030 and later years', () => {
    expect(forecast(initialData, 'Faturamento Bruto', 2030, 0)).toBeCloseTo(81605.1253, 2);
    expect(forecast(initialData, 'Faturamento Bruto', 2040, 0)).toBeGreaterThan(forecast(initialData, 'Faturamento Bruto', 2030, 0));
  });
  it('calculates margin from revenue minus expenses', () => {
    const p = period(initialData, 2023, 0);
    expect(p.margin).toBeCloseTo(33, 8);
  });
  it('preserves category totals for projected periods', () => {
    const c = categories(initialData, 2030, 0);
    expect(c.reduce((s, r) => s + r.revenue, 0)).toBeCloseTo(period(initialData, 2030, 0).revenue, 5);
  });
  it('rejects uploads without the required historical tabs', () => {
    expect(() => validateWorkbook({})).toThrow('Faturamento Bruto');
  });
});
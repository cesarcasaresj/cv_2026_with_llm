import { describe, expect, it } from 'vitest';
import { currentYearMonth, duration, monthsBetween } from './dates';

const text = (years: number, months: number) => `${years}a ${months}m`;

describe('fechas de la experiencia', () => {
  it('cuenta los meses entre dos "AAAA-MM"', () => {
    expect(monthsBetween('2022-05', '2025-02')).toBe(33);
    expect(monthsBetween('2024-03', '2024-03')).toBe(0);
  });

  it('incluye el mes de inicio, como LinkedIn, y usa hoy si sigue en el puesto', () => {
    expect(duration('2024-01', '2024-12', text)).toBe('1a 0m');
    expect(duration('2025-02', null, text, new Date('2026-11-15T00:00:00Z'))).toBe('1a 10m');
    expect(duration('2025-02', '2025-02', text)).toBe('0a 1m');
  });

  it('el mes actual en UTC', () => {
    expect(currentYearMonth(new Date('2026-01-31T23:00:00Z'))).toBe('2026-01');
  });
});

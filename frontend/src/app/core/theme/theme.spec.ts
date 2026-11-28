import { describe, expect, it } from 'vitest';
import { hourInTimeZone, themeCookie, themeForHour, themeFromCookie } from './theme';

describe('tema claro / oscuro (HU-22)', () => {
  it('lee la cookie theme y descarta valores desconocidos', () => {
    expect(themeFromCookie('lang=en; theme=dark')).toBe('dark');
    expect(themeFromCookie('theme=purple')).toBeNull();
    expect(themeFromCookie(null)).toBeNull();
  });

  it('guarda la elección un año en todo el sitio', () => {
    expect(themeCookie('light')).toBe('theme=light; Path=/; Max-Age=31536000; SameSite=Lax');
  });
});

describe('tema según la hora del visitante (HU-27)', () => {
  it('claro de día y oscuro de noche', () => {
    expect(themeForHour(6)).toBe('dark');
    expect(themeForHour(7)).toBe('light');
    expect(themeForHour(18)).toBe('light');
    expect(themeForHour(19)).toBe('dark');
    expect(themeForHour(0)).toBe('dark');
  });

  it('calcula la hora en la zona horaria que manda Cloudflare', () => {
    const noonUtc = new Date('2026-11-27T12:00:00Z');
    expect(hourInTimeZone('UTC', noonUtc)).toBe(12);
    expect(hourInTimeZone('America/Lima', noonUtc)).toBe(7);
    expect(hourInTimeZone('Asia/Tokyo', noonUtc)).toBe(21);
  });

  it('sin zona o con una zona inventada no decide', () => {
    expect(hourInTimeZone(null)).toBeNull();
    expect(hourInTimeZone('Marte/Base')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { themeCookie, themeFromCookie } from './theme';

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

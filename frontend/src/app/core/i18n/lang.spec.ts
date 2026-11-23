import { describe, expect, it } from 'vitest';
import { langFromAcceptLanguage, langFromCookie, negotiateLang } from './lang';

describe('idioma de la página (HU-18)', () => {
  it('lee la cookie lang entre otras cookies', () => {
    expect(langFromCookie('a=1; lang=en; b=2')).toBe('en');
    expect(langFromCookie('lang=fr')).toBeNull();
    expect(langFromCookie(null)).toBeNull();
  });

  it('elige el primer idioma del sitio según la preferencia del navegador', () => {
    expect(langFromAcceptLanguage('en-US,en;q=0.9,es;q=0.8')).toBe('en');
    expect(langFromAcceptLanguage('fr-FR,es;q=0.5,en;q=0.7')).toBe('en');
    expect(langFromAcceptLanguage('fr-FR,de;q=0.9')).toBeNull();
    expect(langFromAcceptLanguage('en;q=0,es')).toBe('es');
  });

  it('la cookie manda sobre el navegador; sin nada, español', () => {
    expect(negotiateLang('lang=es', 'en-US')).toBe('es');
    expect(negotiateLang(null, 'en-GB')).toBe('en');
    expect(negotiateLang(null, null)).toBe('es');
  });
});

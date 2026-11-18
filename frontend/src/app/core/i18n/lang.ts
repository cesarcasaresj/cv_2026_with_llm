import type { components } from '../api/generated';

/** Idiomas del sitio (spec.md, HU-18). El tipo viene del contrato: el mismo que acepta /api/v1/profile?lang=. */
export type Lang = components['schemas']['Lang'];

export const LANGS: readonly Lang[] = ['es', 'en'];
export const DEFAULT_LANG: Lang = 'es';

/** Cookie donde se recuerda la elección. No es un secreto: es una preferencia de visualización. */
export const LANG_COOKIE = 'lang';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** Valor de la cookie `lang` dentro de la cabecera Cookie ("a=1; lang=en; b=2" → "en"). */
export function langFromCookie(cookieHeader: string | null): Lang | null {
  for (const pair of (cookieHeader ?? '').split(';')) {
    const [name, value] = pair.trim().split('=');
    if (name === LANG_COOKIE && isLang(value)) return value;
  }
  return null;
}

/**
 * Primer idioma del sitio que acepta el navegador, respetando su orden de preferencia.
 * "en-US,en;q=0.9,es;q=0.8" → "en".  "fr-FR,de;q=0.9" → null (ninguno coincide).
 */
export function langFromAcceptLanguage(header: string | null): Lang | null {
  const preferences = (header ?? '')
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const quality = params.find((param) => param.trim().startsWith('q='));
      return { lang: tag.trim().toLowerCase().split('-')[0], weight: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .filter((preference) => preference.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return preferences.map((preference) => preference.lang).find(isLang) ?? null;
}

/** Idioma de la primera respuesta: el que eligió la persona (cookie), si no el de su navegador, si no el español. */
export function negotiateLang(cookieHeader: string | null, acceptLanguage: string | null): Lang {
  return langFromCookie(cookieHeader) ?? langFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LANG;
}

/** Cookie que guarda la elección por un año en todo el sitio. Lax: se envía al llegar desde otro sitio (enlaces). */
export function langCookie(lang: Lang): string {
  return `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
}

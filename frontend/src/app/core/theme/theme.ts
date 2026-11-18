/** Temas del sitio (spec.md, HU-22). Sin cookie, manda el sistema: prefers-color-scheme. */
export type Theme = 'light' | 'dark';

export const THEMES: readonly Theme[] = ['light', 'dark'];

/** Cookie donde se recuerda la elección. Como `lang`, es una preferencia de visualización, no un secreto. */
export const THEME_COOKIE = 'theme';
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** Tema guardado en la cabecera Cookie ("a=1; theme=dark" → "dark"); null si la persona no eligió. */
export function themeFromCookie(cookieHeader: string | null): Theme | null {
  for (const pair of (cookieHeader ?? '').split(';')) {
    const [name, value] = pair.trim().split('=');
    if (name === THEME_COOKIE && isTheme(value)) return value;
  }
  return null;
}

/** Cookie que guarda la elección por un año en todo el sitio. */
export function themeCookie(theme: Theme): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
}

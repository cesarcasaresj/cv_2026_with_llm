/** Temas del sitio (spec.md, HU-22 y HU-27). Sin cookie, manda la hora del visitante; sin hora, el sistema. */
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

/** Horario del tema automático (HU-27): claro de 7:00 a 18:59, oscuro el resto. */
export const DAY_STARTS_AT = 7;
export const NIGHT_STARTS_AT = 19;

/** Tema según la hora local del visitante (0–23). */
export function themeForHour(hour: number): Theme {
  return hour >= DAY_STARTS_AT && hour < NIGHT_STARTS_AT ? 'light' : 'dark';
}

/**
 * Hora (0–23) en una zona horaria IANA ("America/Lima"), la que Cloudflare manda en `cf-timezone`.
 * null si la zona falta o no es válida: entonces el servidor no decide y manda el sistema del visitante.
 */
export function hourInTimeZone(timeZone: string | null | undefined, now = new Date()): number | null {
  if (!timeZone) return null;
  try {
    const hour = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now);
    const value = Number(hour);
    return Number.isInteger(value) && value >= 0 && value < 24 ? value : null;
  } catch {
    return null;
  }
}

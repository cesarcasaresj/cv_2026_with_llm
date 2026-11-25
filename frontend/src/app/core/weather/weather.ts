import type { components } from '../api/generated';
import type { Lang } from '../i18n/lang';

export type Weather = components['schemas']['Weather'];
export type WeatherCondition = Weather['condition'];

export const WEATHER_API = '/api/v1/weather';

/** Unidad de cada idioma (spec.md, HU-25): Fahrenheit en inglés, Celsius en español. */
export function temperatureUnit(lang: Lang): 'F' | 'C' {
  return lang === 'en' ? 'F' : 'C';
}

/** Temperatura redondeada en la unidad del idioma: 24.6 °C → "25 °C" en español, "76 °F" en inglés. */
export function formatTemperature(celsius: number, lang: Lang): string {
  const unit = temperatureUnit(lang);
  const value = unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
  // Math.round(-0.4) da -0: se normaliza para no mostrar "-0 °C"
  return `${Math.round(value) + 0} °${unit}`;
}

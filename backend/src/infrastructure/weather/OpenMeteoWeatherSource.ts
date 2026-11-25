import type { Coordinates, Weather, WeatherCondition, WeatherSource } from '../../core/domain/Weather';
import { ServiceUnavailableError } from '../../core/domain/errors';

const TIMEOUT_MS = 4000;
const UNAVAILABLE = 'No pudimos consultar el clima. Intenta de nuevo en unos minutos.';

/** Códigos del tiempo de la OMM (los que usa Open-Meteo) → las condiciones que dibuja el widget. */
export function conditionFromCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

interface OpenMeteoResponse {
  current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
}

/** Clima actual desde Open-Meteo: gratis y sin clave. Solo recibe coordenadas redondeadas, nunca la IP del visitante. */
export class OpenMeteoWeatherSource implements WeatherSource {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async current({ latitude, longitude }: Coordinates): Promise<Weather> {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,weather_code,is_day';
    let body: OpenMeteoResponse;
    try {
      const response = await this.fetchFn(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) {
        console.error(`Open-Meteo respondió ${response.status}`);
        throw new ServiceUnavailableError(UNAVAILABLE);
      }
      body = (await response.json()) as OpenMeteoResponse;
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error;
      throw new ServiceUnavailableError(UNAVAILABLE);
    }

    const current = body.current;
    if (typeof current?.temperature_2m !== 'number' || typeof current.weather_code !== 'number') {
      throw new ServiceUnavailableError(UNAVAILABLE);
    }
    return {
      condition: conditionFromCode(current.weather_code),
      temperatureC: Math.round(current.temperature_2m * 10) / 10,
      isDay: current.is_day !== 0,
    };
  }
}

/**
 * Guarda cada consulta 30 minutos por coordenadas (ya redondeadas), con un máximo de entradas.
 * Si Open-Meteo falla y hay una copia, aunque sea vieja, se sirve esa.
 */
export class CachedWeatherSource implements WeatherSource {
  private readonly cache = new Map<string, { weather: Weather; at: number }>();

  constructor(
    private readonly source: WeatherSource,
    private readonly ttlMs = 30 * 60 * 1000,
    private readonly maxEntries = 500,
    private readonly now: () => number = Date.now,
  ) {}

  async current(coordinates: Coordinates): Promise<Weather> {
    const key = `${coordinates.latitude},${coordinates.longitude}`;
    const cached = this.cache.get(key);
    if (cached && this.now() - cached.at < this.ttlMs) return cached.weather;
    try {
      const weather = await this.source.current(coordinates);
      this.cache.delete(key);
      this.cache.set(key, { weather, at: this.now() });
      // La entrada más antigua sale primero (Map conserva el orden de inserción)
      if (this.cache.size > this.maxEntries) this.cache.delete(this.cache.keys().next().value!);
      return weather;
    } catch (error) {
      if (cached) return cached.weather;
      throw error;
    }
  }
}

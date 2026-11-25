// Clima del visitante para el widget de la cabecera (spec.md, HU-25).
import type { Coordinates, Weather, WeatherSource } from '../domain/Weather';
import { ValidationError } from '../domain/errors';

/** Sin otra ubicación, el clima de Lima (la ciudad del autor). */
export const DEFAULT_PLACE = { name: 'Lima', coordinates: { latitude: -12.05, longitude: -77.04 } };

export type LocationSource = 'browser' | 'network' | 'default';

export interface WeatherReport extends Weather {
  place: string | null;
  source: LocationSource;
}

/** Lo que llega con la petición: las coordenadas del navegador (opt-in) y la ubicación aproximada de Cloudflare. */
export interface LocationHints {
  browser?: { lat: unknown; lon: unknown };
  network?: { lat: unknown; lon: unknown; city: unknown };
}

/** Un decimal: unos 10 km. Basta para el clima, protege la ubicación exacta y permite reutilizar la caché. */
export function roundCoordinates({ latitude, longitude }: Coordinates): Coordinates {
  return { latitude: Math.round(latitude * 10) / 10, longitude: Math.round(longitude * 10) / 10 };
}

function parseCoordinates(lat: unknown, lon: unknown): Coordinates | null {
  if (lat === undefined && lon === undefined) return null;
  const latitude = typeof lat === 'number' ? lat : Number(lat);
  const longitude = typeof lon === 'number' ? lon : Number(lon);
  if (
    (typeof lat === 'string' && lat.trim() === '') ||
    (typeof lon === 'string' && lon.trim() === '') ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return { latitude, longitude };
}

export class GetWeather {
  constructor(private readonly source: WeatherSource) {}

  async execute(hints: LocationHints): Promise<WeatherReport> {
    // Coordenadas del navegador: si llegan, tienen que ser válidas
    if (hints.browser && (hints.browser.lat !== undefined || hints.browser.lon !== undefined)) {
      const coordinates = parseCoordinates(hints.browser.lat, hints.browser.lon);
      if (!coordinates) throw new ValidationError('Coordenadas no válidas: lat entre -90 y 90, lon entre -180 y 180.');
      return { ...(await this.source.current(roundCoordinates(coordinates))), place: null, source: 'browser' };
    }

    // Ubicación aproximada de Cloudflare: si falta o no es válida, se ignora
    const network = hints.network ? parseCoordinates(hints.network.lat, hints.network.lon) : null;
    if (network) {
      const city = typeof hints.network?.city === 'string' && hints.network.city.trim() ? hints.network.city.trim() : null;
      return { ...(await this.source.current(roundCoordinates(network))), place: city, source: 'network' };
    }

    return { ...(await this.source.current(DEFAULT_PLACE.coordinates)), place: DEFAULT_PLACE.name, source: 'default' };
  }
}

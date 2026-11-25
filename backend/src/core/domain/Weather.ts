/** Clima del widget de la cabecera (spec.md, HU-25). */
export type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder';

export interface Weather {
  condition: WeatherCondition;
  temperatureC: number;
  isDay: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Puerto hacia el servicio del clima (Open-Meteo en infraestructura). */
export interface WeatherSource {
  current(coordinates: Coordinates): Promise<Weather>;
}

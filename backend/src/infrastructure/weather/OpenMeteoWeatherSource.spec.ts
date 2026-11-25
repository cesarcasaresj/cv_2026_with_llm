import { describe, expect, it, vi } from 'vitest';
import { CachedWeatherSource, OpenMeteoWeatherSource, conditionFromCode } from './OpenMeteoWeatherSource';
import { ServiceUnavailableError } from '../../core/domain/errors';
import type { WeatherSource } from '../../core/domain/Weather';

const point = { latitude: -12.1, longitude: -77 };

describe('conditionFromCode (códigos de la OMM)', () => {
  it.each([
    [0, 'clear'],
    [2, 'partly-cloudy'],
    [3, 'cloudy'],
    [45, 'fog'],
    [53, 'drizzle'],
    [63, 'rain'],
    [81, 'rain'],
    [75, 'snow'],
    [95, 'thunder'],
    [999, 'thunder'],
  ])('%i → %s', (code, condition) => {
    expect(conditionFromCode(code)).toBe(condition);
  });
});

describe('OpenMeteoWeatherSource (HU-25)', () => {
  it('consulta el clima actual de las coordenadas y lo traduce', async () => {
    const fetchFn = vi.fn(async () => Response.json({ current: { temperature_2m: 24.56, weather_code: 61, is_day: 0 } }));
    const weather = await new OpenMeteoWeatherSource(fetchFn as unknown as typeof fetch).current(point);
    expect(weather).toEqual({ condition: 'rain', temperatureC: 24.6, isDay: false });
    expect(String(fetchFn.mock.calls[0])).toContain('latitude=-12.1&longitude=-77&current=temperature_2m,weather_code,is_day');
  });

  it('si Open-Meteo falla o responde algo inesperado, 503', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const down = new OpenMeteoWeatherSource((async () => new Response('', { status: 500 })) as unknown as typeof fetch);
    await expect(down.current(point)).rejects.toThrow(ServiceUnavailableError);
    const odd = new OpenMeteoWeatherSource((async () => Response.json({})) as unknown as typeof fetch);
    await expect(odd.current(point)).rejects.toThrow(ServiceUnavailableError);
    error.mockRestore();
  });
});

describe('CachedWeatherSource', () => {
  it('guarda cada punto 30 minutos y, si la fuente falla, sirve la última copia', async () => {
    let now = 0;
    let fail = false;
    let calls = 0;
    const source: WeatherSource = {
      current: async () => {
        calls++;
        if (fail) throw new Error('caído');
        return { condition: 'clear', temperatureC: calls, isDay: true };
      },
    };
    const cached = new CachedWeatherSource(source, 30 * 60 * 1000, 500, () => now);
    expect((await cached.current(point)).temperatureC).toBe(1);
    expect((await cached.current(point)).temperatureC).toBe(1);
    now += 31 * 60 * 1000;
    fail = true;
    expect((await cached.current(point)).temperatureC).toBe(1);
    expect(calls).toBe(2);
  });

  it('no guarda más entradas de las permitidas', async () => {
    const source: WeatherSource = { current: async () => ({ condition: 'fog', temperatureC: 1, isDay: true }) };
    let calls = 0;
    const counting: WeatherSource = { current: async (c) => (calls++, source.current(c)) };
    const cached = new CachedWeatherSource(counting, 60_000, 2);
    await cached.current({ latitude: 1, longitude: 1 });
    await cached.current({ latitude: 2, longitude: 2 });
    await cached.current({ latitude: 3, longitude: 3 });
    await cached.current({ latitude: 1, longitude: 1 });
    expect(calls).toBe(4);
  });
});

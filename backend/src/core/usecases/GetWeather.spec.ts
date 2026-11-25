import { describe, expect, it } from 'vitest';
import { DEFAULT_PLACE, GetWeather, roundCoordinates } from './GetWeather';
import { ValidationError } from '../domain/errors';
import type { Coordinates, WeatherSource } from '../domain/Weather';

function setup() {
  const asked: Coordinates[] = [];
  const source: WeatherSource = {
    current: async (coordinates) => {
      asked.push(coordinates);
      return { condition: 'rain', temperatureC: 12.3, isDay: true };
    },
  };
  return { getWeather: new GetWeather(source), asked };
}

describe('GetWeather (HU-25)', () => {
  it('redondea a un decimal (unos 10 km) antes de consultar', () => {
    expect(roundCoordinates({ latitude: 40.41678, longitude: -3.70379 })).toEqual({ latitude: 40.4, longitude: -3.7 });
  });

  it('usa las coordenadas del navegador si la persona las compartió', async () => {
    const { getWeather, asked } = setup();
    const report = await getWeather.execute({
      browser: { lat: '40.41678', lon: '-3.70379' },
      network: { lat: '-12.04', lon: '-77.03', city: 'Lima' },
    });
    expect(asked).toEqual([{ latitude: 40.4, longitude: -3.7 }]);
    expect(report).toEqual({ condition: 'rain', temperatureC: 12.3, isDay: true, place: null, source: 'browser' });
  });

  it('sin navegador, usa la ubicación aproximada de Cloudflare con su ciudad', async () => {
    const { getWeather, asked } = setup();
    const report = await getWeather.execute({ browser: {}, network: { lat: '19.43', lon: '-99.13', city: 'Mexico City' } } as never);
    expect(asked).toEqual([{ latitude: 19.4, longitude: -99.1 }]);
    expect(report).toMatchObject({ place: 'Mexico City', source: 'network' });
  });

  it('sin ubicación (o con cabeceras inválidas), el clima de Lima', async () => {
    const { getWeather, asked } = setup();
    const report = await getWeather.execute({ network: { lat: 'x', lon: undefined, city: undefined } });
    expect(asked).toEqual([DEFAULT_PLACE.coordinates]);
    expect(report).toMatchObject({ place: 'Lima', source: 'default' });
  });

  it.each([
    [{ lat: '91', lon: '0' }],
    [{ lat: '0', lon: '-181' }],
    [{ lat: 'abc', lon: '1' }],
    [{ lat: '10', lon: undefined }],
    [{ lat: '', lon: '' }],
  ])('rechaza coordenadas del navegador inválidas %j', async (browser) => {
    const { getWeather, asked } = setup();
    await expect(getWeather.execute({ browser })).rejects.toThrow(ValidationError);
    expect(asked).toEqual([]);
  });
});

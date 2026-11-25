import { describe, expect, it } from 'vitest';
import { formatTemperature, temperatureUnit } from './weather';

describe('temperatura del widget del clima (HU-25)', () => {
  it('Fahrenheit en inglés, Celsius en español', () => {
    expect(temperatureUnit('en')).toBe('F');
    expect(temperatureUnit('es')).toBe('C');
  });

  it('convierte y redondea', () => {
    expect(formatTemperature(24.6, 'es')).toBe('25 °C');
    expect(formatTemperature(24.6, 'en')).toBe('76 °F');
    expect(formatTemperature(0, 'en')).toBe('32 °F');
    expect(formatTemperature(-40, 'en')).toBe('-40 °F');
  });

  it('nunca muestra "-0"', () => {
    expect(formatTemperature(-0.4, 'es')).toBe('0 °C');
  });
});

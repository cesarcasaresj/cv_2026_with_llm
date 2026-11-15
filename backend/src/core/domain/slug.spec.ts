import { describe, expect, it } from 'vitest';
import { SLUG_PATTERN, slugify } from './slug';

describe('slugify', () => {
  it('quita tildes y eñes, y usa minúsculas con guiones', () => {
    expect(slugify('Diseño Accesible')).toBe('diseno-accesible');
  });

  it('convierte símbolos y espacios repetidos en un solo guion', () => {
    expect(slugify('  Node.js  &  TypeScript ')).toBe('node-js-typescript');
  });

  it('el resultado siempre cumple el formato de slug del contrato', () => {
    expect(SLUG_PATTERN.test(slugify('¿Qué es OpenAPI 3.1?'))).toBe(true);
  });
});

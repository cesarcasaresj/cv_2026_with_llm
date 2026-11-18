import { describe, expect, it } from 'vitest';
import { NOTES, SECRET_MELODY, melodyProgress, type NoteId } from './melody';

describe('melodyProgress', () => {
  it('sin notas no hay avance', () => {
    expect(melodyProgress([])).toBe(0);
  });

  it('cuenta las notas del principio de la melodía tocadas al final', () => {
    expect(melodyProgress(['idea', 'web', 'spark'])).toBe(2);
    expect(melodyProgress(['web', 'spark', 'idea', 'web'])).toBe(4);
  });

  it('una nota equivocada reinicia el avance', () => {
    expect(melodyProgress(['web', 'spark', 'dream'])).toBe(0);
  });

  it('la melodía completa da 6, aunque antes se tocaran otras notas', () => {
    expect(melodyProgress(['dream', 'dream', ...SECRET_MELODY])).toBe(SECRET_MELODY.length);
  });

  it('reconoce un nuevo comienzo dentro de un intento fallido', () => {
    // "web, spark, web" falla en la tercera nota, pero esa "web" vuelve a empezar la melodía
    expect(melodyProgress(['web', 'spark', 'web'])).toBe(1);
    expect(melodyProgress(['web', 'spark', 'web', 'spark'])).toBe(2);
  });
});

describe('NOTES', () => {
  it('hay una nota por cada línea del pentagrama, de grave a agudo', () => {
    expect(NOTES.map((note) => note.line)).toEqual([0, 1, 2, 3, 4]);
    const frequencies = NOTES.map((note) => note.frequency);
    expect([...frequencies].sort((a, b) => a - b)).toEqual(frequencies);
  });

  it('la melodía secreta solo usa notas que existen', () => {
    const ids = new Set<NoteId>(NOTES.map((note) => note.id));
    expect(SECRET_MELODY.every((id) => ids.has(id))).toBe(true);
  });
});

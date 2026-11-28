// "La nana de las ideas" (spec.md, HU-19): las notas que se tocan en la portada y la melodía secreta.
// Lógica pura, sin DOM ni Angular: la usan el teclado de notas, la escena y el sonido, y se prueba sola.

export type NoteId = 'idea' | 'code' | 'spark' | 'web' | 'dream';

export interface Note {
  id: NoteId;
  /** Símbolo visible en el botón y en el pentagrama. */
  glyph: string;
  /** Color de la nota (decorativo: el botón no depende de él para entenderse). */
  color: string;
  /** Frecuencia en Hz. Las cinco forman una escala pentatónica: suenan bien en cualquier orden. */
  frequency: number;
  /** Línea del pentagrama donde se dibuja: 0 es la de abajo, 4 la de arriba. */
  line: number;
}

/** De la más grave a la más aguda. Teclas 1 a 5 en ese orden. */
export const NOTES: readonly Note[] = [
  { id: 'idea', glyph: '◆', color: '#3a63d8', frequency: 587.33, line: 0 }, // Re
  { id: 'code', glyph: '{ }', color: '#8fb0f5', frequency: 659.25, line: 1 }, // Mi
  { id: 'spark', glyph: '⚡', color: '#c9a46a', frequency: 739.99, line: 2 }, // Fa#
  { id: 'web', glyph: '</>', color: '#f5f7ff', frequency: 880.0, line: 3 }, // La
  { id: 'dream', glyph: '✦', color: '#d9a441', frequency: 987.77, line: 4 }, // Si
];

/**
 * La melodía secreta: una nana original de seis notas, que baja y vuelve a subir como un arrullo.
 * Quien la toque activa el modo fiesta.
 */
export const SECRET_MELODY: readonly NoteId[] = ['web', 'spark', 'idea', 'web', 'spark', 'code'];

/**
 * Colores de las notas sobre fondo claro (modo claro): los de NOTES están pensados para el fondo oscuro
 * y algunos (el blanco de "web", el azul claro de "code") casi no se ven sobre gris claro.
 */
export const LIGHT_NOTE_COLORS: Readonly<Record<NoteId, string>> = {
  idea: '#2f55c4',
  code: '#3f6fd8',
  spark: '#8a6420',
  web: '#2b2f36',
  dream: '#7d5200',
};

/** Color de la nota según el tema. */
export function noteColor(id: NoteId, light: boolean): string {
  return light ? LIGHT_NOTE_COLORS[id] : noteById(id).color;
}

export function noteById(id: NoteId): Note {
  return NOTES.find((note) => note.id === id)!;
}

/**
 * Cuántas notas seguidas de la melodía secreta acaba de tocar la persona (de 0 a 6).
 * Mira el final de lo tocado: si las últimas notas coinciden con el principio de la melodía, ese es el avance.
 *
 *   tocado [idea, web, spark]       → 2 (web, spark)
 *   tocado [web, spark, idea, web]  → 4
 *   tocado [web, dream]             → 0
 */
export function melodyProgress(played: readonly NoteId[], melody: readonly NoteId[] = SECRET_MELODY): number {
  // Se prueba desde el avance más largo posible hacia abajo: el primero que encaja es el bueno
  for (let length = Math.min(played.length, melody.length); length > 0; length--) {
    const end = played.slice(played.length - length);
    if (end.every((note, index) => note === melody[index])) return length;
  }
  return 0;
}

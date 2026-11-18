// Fechas de la experiencia: LinkedIn guarda año y mes ("2024-03"), sin día.

/** "AAAA-MM" → fecha UTC del día 1, para el pipe date. */
export function toDate(yearMonth: string): string {
  return `${yearMonth}-01T00:00:00Z`;
}

/** Meses entre dos "AAAA-MM" (el final no incluido). */
export function monthsBetween(from: string, to: string): number {
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
}

/** El mes actual como "AAAA-MM". */
export function currentYearMonth(today = new Date()): string {
  return `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Cómo se escribe "2 años y 3 meses" en cada idioma (viene del diccionario). */
export type DurationText = (years: number, months: number) => string;

/** Duración legible: "2 años y 3 meses", "8 meses". Incluye el mes de inicio, como LinkedIn. */
export function duration(startedOn: string, finishedOn: string | null, text: DurationText, today = new Date()): string {
  const months = Math.max(1, monthsBetween(startedOn, finishedOn ?? currentYearMonth(today)) + 1);
  return text(Math.floor(months / 12), months % 12);
}

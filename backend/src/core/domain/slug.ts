export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Convierte un nombre en un slug de URL: "Diseño Accesible" → "diseno-accesible".
 * Pasos: separa las tildes de sus letras y las quita, pasa a minúsculas,
 * cambia todo lo que no sea letra o número por guiones y quita los guiones sobrantes.
 */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

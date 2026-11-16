import { ValidationError } from './errors';
import { slugify } from './slug';

/** Categoría o etiqueta: los dos niveles de la taxonomía de un artículo (spec.md, HU-11). */
export interface TaxonomyRef {
  id: number;
  name: string;
  slug: string;
}

export interface TaxonomySummary extends TaxonomyRef {
  /** Artículos publicados con esta categoría o etiqueta. */
  postCount: number;
}

/** Puerto común para categorías y etiquetas: se consultan de la misma forma. */
export interface TaxonomyRepository {
  /** Solo los términos con al menos un artículo publicado, ordenados por nombre (HU-06, HU-11). */
  listWithPostCount(): Promise<TaxonomySummary[]>;
  findById(id: number): Promise<TaxonomyRef | null>;
  findBySlug(slug: string): Promise<TaxonomyRef | null>;
}

/** Categoría vista por el autor: incluye las vacías y `postCount` cuenta también los borradores. */
export type ManagedCategory = TaxonomySummary;

export type CategoryDeletion = 'deleted' | 'not-found' | 'in-use';

/**
 * Lista fija de categorías (spec.md, HU-09 y pregunta 2): solo el autor las crea, renombra o borra.
 * El resto del sistema (incluido el script de carga) solo elige una existente.
 */
export interface CategoryCatalog {
  /** Todas, ordenadas por nombre. */
  listAll(): Promise<ManagedCategory[]>;
  findById(id: number): Promise<ManagedCategory | null>;
  /** Otra categoría con el mismo nombre (sin distinguir mayúsculas) o el mismo slug, o null. */
  findConflict(name: string, slug: string, exceptId?: number): Promise<TaxonomyRef | null>;
  create(name: string, slug: string): Promise<ManagedCategory>;
  /** null si la categoría no existe. */
  rename(id: number, name: string, slug: string): Promise<ManagedCategory | null>;
  /** Nunca borra una categoría con artículos (decisión C). */
  delete(id: number): Promise<CategoryDeletion>;
}

export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 40;

/**
 * Valida y normaliza el nombre de una categoría (HU-09): obligatorio, de 2 a 40 caracteres,
 * sin espacios sobrantes, y con un slug utilizable en la URL.
 */
export function categoryName(raw: unknown): { name: string; slug: string } {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  if (name.length < CATEGORY_NAME_MIN || name.length > CATEGORY_NAME_MAX) {
    throw new ValidationError(
      `El nombre de la categoría debe tener entre ${CATEGORY_NAME_MIN} y ${CATEGORY_NAME_MAX} caracteres.`,
    );
  }

  const slug = slugify(name);
  if (slug === '') throw new ValidationError('El nombre de la categoría debe incluir letras o números.');
  return { name, slug };
}

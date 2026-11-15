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

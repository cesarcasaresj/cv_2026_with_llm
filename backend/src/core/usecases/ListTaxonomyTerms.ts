import type { TaxonomyRepository, TaxonomySummary } from '../domain/Taxonomy';

/** Lista categorías o etiquetas, según el repositorio que reciba (spec.md, HU-06 y HU-11). */
export class ListTaxonomyTerms {
  constructor(private readonly terms: TaxonomyRepository) {}

  execute(): Promise<TaxonomySummary[]> {
    return this.terms.listWithPostCount();
  }
}

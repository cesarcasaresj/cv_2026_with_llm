import { describe, expect, it } from 'vitest';
import { ListTaxonomyTerms } from './ListTaxonomyTerms';
import { ListSitemapEntries } from './ListSitemapEntries';
import { accesibilidad, diseno, fakePosts, fakeTaxonomy, sampleArticle } from './testing/fakes';

describe('ListTaxonomyTerms', () => {
  it('devuelve los términos del repositorio con su número de artículos', async () => {
    const result = await new ListTaxonomyTerms(fakeTaxonomy([diseno, accesibilidad])).execute();

    expect(result.map((term) => term.slug)).toEqual(['diseno', 'accesibilidad']);
    expect(result.every((term) => term.postCount >= 1)).toBe(true);
  });
});

describe('ListSitemapEntries', () => {
  it('devuelve el slug y la fecha de actualización de cada artículo publicado', async () => {
    const article = sampleArticle({ slug: 'mi-articulo' });

    const result = await new ListSitemapEntries(fakePosts([], [article])).execute();

    expect(result).toEqual([{ slug: 'mi-articulo', updatedAt: article.updatedAt }]);
  });
});

// Repositorios simulados para las pruebas de los casos de uso (constitution.md, sección 7).
import type { Article, PostFilter, PostRepository, PostSummary } from '../../domain/Post';
import type { TaxonomyRef, TaxonomyRepository } from '../../domain/Taxonomy';

export const diseno: TaxonomyRef = { id: 7, name: 'Diseño', slug: 'diseno' };
export const accesibilidad: TaxonomyRef = { id: 3, name: 'Accesibilidad', slug: 'accesibilidad' };

export function samplePost(overrides: Partial<PostSummary> = {}): PostSummary {
  return {
    id: 1,
    slug: 'primer-articulo',
    title: 'Primer artículo de prueba',
    description: 'Descripción de prueba con la longitud suficiente para cumplir la regla de SEO.',
    publishedAt: new Date('2026-11-01T10:00:00Z'),
    category: diseno,
    tags: [accesibilidad],
    cover: null,
    ...overrides,
  };
}

export function sampleArticle(overrides: Partial<Article> = {}): Article {
  return {
    ...samplePost(),
    seoTitle: null,
    updatedAt: new Date('2026-11-02T10:00:00Z'),
    bodyMarkdown: '# Introducción\n\nTexto del artículo.',
    authorName: 'Autor de prueba',
    ...overrides,
  };
}

/** Repositorio de términos (categorías o etiquetas) a partir de una lista fija. */
export function fakeTaxonomy(terms: TaxonomyRef[]): TaxonomyRepository {
  return {
    listWithPostCount: async () => terms.map((term) => ({ ...term, postCount: 1 })),
    findById: async (id) => terms.find((term) => term.id === id) ?? null,
    findBySlug: async (slug) => terms.find((term) => term.slug === slug) ?? null,
  };
}

/** Repositorio de artículos que filtra en memoria igual que la consulta real. */
export function fakePosts(posts: PostSummary[], articles: Article[] = []): PostRepository {
  return {
    getTotalPostsCount: async () => ({ total: posts.length, lastUpdated: null }),
    listPosts: async (filter: PostFilter = {}) =>
      posts.filter(
        (post) =>
          (filter.categoryId === undefined || post.category.id === filter.categoryId) &&
          (filter.tagId === undefined || post.tags.some((tag) => tag.id === filter.tagId)),
      ),
    findPublishedBySlug: async (slug) => articles.find((article) => article.slug === slug) ?? null,
    listSitemapEntries: async () => articles.map(({ slug, updatedAt }) => ({ slug, updatedAt })),
  };
}

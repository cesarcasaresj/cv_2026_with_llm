// Repositorios simulados para las pruebas de los casos de uso (constitution.md, sección 7).
import type { Article, AuthorPost, AuthorPostRepository, PostFilter, PostRepository, PostSummary } from '../../domain/Post';
import type { CategoryCatalog, ManagedCategory, TaxonomyRef, TaxonomyRepository } from '../../domain/Taxonomy';

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

/**
 * Lista fija de categorías en memoria. `postCount` indica cuántos artículos tiene cada una,
 * para probar el bloqueo al borrar una categoría en uso.
 */
export function fakeCatalog(initial: ManagedCategory[]): CategoryCatalog & { items: ManagedCategory[] } {
  const items = initial.map((category) => ({ ...category }));
  let nextId = Math.max(0, ...items.map((category) => category.id)) + 1;

  return {
    items,
    listAll: async () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    findById: async (id) => items.find((category) => category.id === id) ?? null,
    findConflict: async (name, slug, exceptId) =>
      items.find(
        (category) =>
          category.id !== exceptId && (category.name.toLowerCase() === name.toLowerCase() || category.slug === slug),
      ) ?? null,
    create: async (name, slug) => {
      const category = { id: nextId++, name, slug, postCount: 0 };
      items.push(category);
      return category;
    },
    rename: async (id, name, slug) => {
      const category = items.find((item) => item.id === id);
      if (!category) return null;
      Object.assign(category, { name, slug });
      return category;
    },
    delete: async (id) => {
      const index = items.findIndex((category) => category.id === id);
      if (index < 0) return 'not-found';
      if (items[index].postCount > 0) return 'in-use';
      items.splice(index, 1);
      return 'deleted';
    },
  };
}

/** Artículos del autor en memoria; assignCategory busca la categoría en el catálogo dado. */
export function fakeAuthorPosts(initial: AuthorPost[], catalog: CategoryCatalog): AuthorPostRepository {
  const items = initial.map((post) => ({ ...post }));
  return {
    listAll: async () => [...items].sort((a, b) => a.title.localeCompare(b.title)),
    assignCategory: async (postId, categoryId) => {
      const post = items.find((item) => item.id === postId);
      const category = await catalog.findById(categoryId);
      if (!post || !category) return null;
      post.category = { id: category.id, name: category.name, slug: category.slug };
      return post;
    },
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

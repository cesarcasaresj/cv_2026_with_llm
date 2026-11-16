import type { TaxonomyRef } from './Taxonomy';

export interface PostCount {
  total: number;
  lastUpdated: Date | null;
}

/** Portada guardada: `path` es el nombre base del archivo, sin extensión (spec.md, decisión H). */
export interface CoverImage {
  path: string;
  alt: string;
  decorative: boolean;
  width: number;
  height: number;
}

/** Lo que muestran las listas de artículos (spec.md, §5.1). */
export interface PostSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  category: TaxonomyRef;
  tags: TaxonomyRef[];
  cover: CoverImage | null;
}

/** Artículo completo, tal como está guardado (el cuerpo sigue en Markdown). */
export interface Article extends PostSummary {
  seoTitle: string | null;
  updatedAt: Date;
  bodyMarkdown: string;
  authorName: string;
}

export interface PostFilter {
  categoryId?: number;
  tagId?: number;
}

export interface SitemapEntry {
  slug: string;
  updatedAt: Date;
}

/** Todas las consultas devuelven solo artículos publicados (spec.md, decisión F). */
export interface PostRepository {
  getTotalPostsCount(): Promise<PostCount>;
  listPosts(filter?: PostFilter): Promise<PostSummary[]>;
  findPublishedBySlug(slug: string): Promise<Article | null>;
  listSitemapEntries(): Promise<SitemapEntry[]>;
}

/** Artículo en la vista del autor: incluye los borradores (spec.md, HU-08). */
export interface AuthorPost {
  id: number;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  category: TaxonomyRef;
}

/** Puerto de la vista del autor. A diferencia de PostRepository, ve también los borradores. */
export interface AuthorPostRepository {
  /** Todos los artículos, ordenados por título. */
  listAll(): Promise<AuthorPost[]>;
  /** Cambia la categoría del artículo. null si el artículo no existe. */
  assignCategory(postId: number, categoryId: number): Promise<AuthorPost | null>;
}

/** Puerto: convierte el Markdown del cuerpo en HTML. La implementación (marked) vive en infrastructure. */
export interface MarkdownRenderer {
  render(markdown: string): string;
}

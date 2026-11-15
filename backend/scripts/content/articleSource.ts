// Lee y valida un archivo de artículo (front matter + Markdown) según spec.md, §5.1.
// No toca la base de datos ni el disco: así se puede probar de forma aislada.
import matter from 'gray-matter';
import { SLUG_PATTERN, slugify } from '../../src/core/domain/slug';

export const MAX_TAGS = 10;

export interface CoverSource {
  file: string;
  alt: string;
  decorative: boolean;
}

export interface ArticleSource {
  slug: string;
  title: string;
  seoTitle: string | null;
  description: string | null;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  publishedAt: Date | null;
  updatedAt: Date | null;
  cover: CoverSource | null;
  bodyMarkdown: string;
}

export type ParseResult = { ok: true; article: ArticleSource } | { ok: false; errors: string[] };

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function date(value: unknown): Date | null {
  // YAML convierte "2026-11-15" en Date; también se acepta texto ISO
  const parsed = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function lengthBetween(value: string | null, min: number, max: number): boolean {
  return value !== null && value.length >= min && value.length <= max;
}

export function parseArticle(slug: string, fileContent: string): ParseResult {
  const { data, content } = matter(fileContent);
  const errors: string[] = [];

  if (!SLUG_PATTERN.test(slug)) {
    errors.push(`El nombre del archivo debe ser un slug (minúsculas, números y guiones): "${slug}"`);
  }

  const title = text(data.title);
  if (!lengthBetween(title, 10, 110)) errors.push('title es obligatorio y debe tener entre 10 y 110 caracteres');

  const seoTitle = text(data.seoTitle);
  if (seoTitle !== null && seoTitle.length > 60) errors.push('seoTitle no puede pasar de 60 caracteres');

  const status = data.status ?? 'draft';
  if (status !== 'draft' && status !== 'published') errors.push('status debe ser "draft" o "published"');
  const isPublished = status === 'published';

  const description = text(data.description);
  if (description !== null && !lengthBetween(description, 50, 160)) {
    errors.push(`description debe tener entre 50 y 160 caracteres (tiene ${description.length})`);
  }
  if (isPublished && description === null) errors.push('description es obligatoria para publicar');

  const category = text(data.category);
  if (!lengthBetween(category, 2, 40)) errors.push('category es obligatoria y debe tener entre 2 y 40 caracteres');

  const rawTags: unknown[] = Array.isArray(data.tags) ? data.tags : [];
  const tags = rawTags.map(text).filter((tag): tag is string => tag !== null);
  if (tags.length !== rawTags.length || tags.some((tag) => tag.length < 2 || tag.length > 40)) {
    errors.push('cada etiqueta debe ser un texto de entre 2 y 40 caracteres');
  }
  if (tags.length > MAX_TAGS) errors.push(`un artículo puede tener como máximo ${MAX_TAGS} etiquetas`);
  if (new Set(tags.map(slugify)).size !== tags.length) errors.push('hay etiquetas repetidas');

  const publishedAt = date(data.publishedAt);
  if (isPublished && publishedAt === null) errors.push('publishedAt es obligatoria para publicar (por ejemplo 2026-11-15)');
  const updatedAt = date(data.updatedAt);
  if (updatedAt && publishedAt && updatedAt < publishedAt) errors.push('updatedAt no puede ser anterior a publishedAt');

  let cover: CoverSource | null = null;
  if (data.cover !== undefined) {
    const file = text(data.cover?.file);
    const decorative = data.cover?.decorative === true;
    const alt = text(data.cover?.alt) ?? '';
    if (file === null) errors.push('cover.file es obligatorio si hay portada');
    // HU-13: una portada informativa necesita texto alternativo
    if (!decorative && alt === '') errors.push('cover.alt es obligatorio, salvo que cover.decorative sea true');
    cover = file === null ? null : { file, alt, decorative };
  }

  const bodyMarkdown = content.trim();
  if (isPublished && bodyMarkdown === '') errors.push('el cuerpo del artículo no puede estar vacío para publicar');

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    article: {
      slug,
      title: title!,
      seoTitle,
      description,
      category: category!,
      tags,
      status,
      publishedAt,
      updatedAt,
      cover,
      bodyMarkdown,
    },
  };
}

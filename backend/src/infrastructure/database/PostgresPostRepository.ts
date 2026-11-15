import type { Pool } from 'pg';
import type {
  Article,
  PostCount,
  PostFilter,
  PostRepository,
  PostSummary,
  SitemapEntry,
} from '../../core/domain/Post';
import type { TaxonomyRef } from '../../core/domain/Taxonomy';

// Columnas comunes a la lista y al detalle. Las etiquetas llegan agrupadas como JSON en una sola fila.
const SUMMARY_COLUMNS = `
  p.id, p.slug, p.title, p.description, p.published_at,
  p.cover_image_path, p.cover_image_alt, p.cover_is_decorative, p.cover_width, p.cover_height,
  c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
  COALESCE((
    SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug) ORDER BY t.name)
      FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
     WHERE pt.post_id = p.id
  ), '[]'::json) AS tags`;

interface SummaryRow {
  id: number;
  slug: string;
  title: string;
  description: string;
  published_at: Date;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  cover_is_decorative: boolean;
  cover_width: number | null;
  cover_height: number | null;
  category_id: number;
  category_name: string;
  category_slug: string;
  tags: TaxonomyRef[];
}

interface ArticleRow extends SummaryRow {
  seo_title: string | null;
  updated_at: Date;
  body_markdown: string;
  author_name: string | null;
}

function toSummary(row: SummaryRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    publishedAt: row.published_at,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
    tags: row.tags,
    cover:
      row.cover_image_path && row.cover_width && row.cover_height
        ? {
            path: row.cover_image_path,
            alt: row.cover_image_alt ?? '',
            decorative: row.cover_is_decorative,
            width: row.cover_width,
            height: row.cover_height,
          }
        : null,
  };
}

/** Todas las consultas filtran por status = 'published' (spec.md, decisión F). */
export class PostgresPostRepository implements PostRepository {
  constructor(private readonly pool: Pool) {}

  async getTotalPostsCount(): Promise<PostCount> {
    // COUNT(*) llega como texto desde Postgres, por eso se convierte con Number()
    const { rows } = await this.pool.query<{ total: string; last_updated: Date | null }>(
      `SELECT COUNT(*) AS total, MAX(published_at) AS last_updated FROM posts WHERE status = 'published'`,
    );

    return { total: Number(rows[0].total), lastUpdated: rows[0].last_updated };
  }

  async listPosts(filter: PostFilter = {}): Promise<PostSummary[]> {
    const { rows } = await this.pool.query<SummaryRow>(
      `SELECT ${SUMMARY_COLUMNS}
         FROM posts p
         JOIN categories c ON c.id = p.category_id
        WHERE p.status = 'published'
          AND ($1::int IS NULL OR p.category_id = $1)
          AND ($2::int IS NULL OR EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = $2))
        ORDER BY p.published_at DESC, p.id DESC`,
      [filter.categoryId ?? null, filter.tagId ?? null],
    );
    return rows.map(toSummary);
  }

  async findPublishedBySlug(slug: string): Promise<Article | null> {
    const { rows } = await this.pool.query<ArticleRow>(
      `SELECT ${SUMMARY_COLUMNS},
              p.seo_title, p.updated_at, p.body_markdown, u.display_name AS author_name
         FROM posts p
         JOIN categories c ON c.id = p.category_id
         JOIN users u ON u.id = p.author_id
        WHERE p.slug = $1 AND p.status = 'published'`,
      [slug],
    );

    const row = rows[0];
    if (!row) return null;

    return {
      ...toSummary(row),
      seoTitle: row.seo_title,
      updatedAt: row.updated_at,
      bodyMarkdown: row.body_markdown,
      // El script de carga exige display_name; el correo nunca se usa como nombre público
      authorName: row.author_name ?? 'Autor del sitio',
    };
  }

  async listSitemapEntries(): Promise<SitemapEntry[]> {
    const { rows } = await this.pool.query<{ slug: string; updated_at: Date }>(
      `SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY published_at DESC`,
    );
    return rows.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
  }
}

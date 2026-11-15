import type { Pool } from 'pg';
import type { TaxonomyRef, TaxonomyRepository, TaxonomySummary } from '../../core/domain/Taxonomy';

// Categorías y etiquetas se consultan igual; solo cambia cómo se cuentan sus artículos publicados.
// El INNER JOIN deja fuera los términos sin artículos publicados (spec.md, HU-06 decisión A, y HU-11).
const QUERIES = {
  category: {
    table: 'categories',
    listWithPostCount: `
      SELECT c.id, c.name, c.slug, COUNT(p.id) AS post_count
        FROM categories c
        JOIN posts p ON p.category_id = c.id AND p.status = 'published'
       GROUP BY c.id
       ORDER BY c.name`,
  },
  tag: {
    table: 'tags',
    listWithPostCount: `
      SELECT t.id, t.name, t.slug, COUNT(p.id) AS post_count
        FROM tags t
        JOIN post_tags pt ON pt.tag_id = t.id
        JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
       GROUP BY t.id
       ORDER BY t.name`,
  },
} as const;

export class PostgresTaxonomyRepository implements TaxonomyRepository {
  constructor(
    private readonly pool: Pool,
    private readonly kind: keyof typeof QUERIES,
  ) {}

  async listWithPostCount(): Promise<TaxonomySummary[]> {
    const { rows } = await this.pool.query<TaxonomyRef & { post_count: string }>(QUERIES[this.kind].listWithPostCount);

    // COUNT llega como texto desde Postgres, por eso se convierte con Number()
    return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, postCount: Number(row.post_count) }));
  }

  async findById(id: number): Promise<TaxonomyRef | null> {
    const { rows } = await this.pool.query<TaxonomyRef>(
      `SELECT id, name, slug FROM ${QUERIES[this.kind].table} WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<TaxonomyRef | null> {
    const { rows } = await this.pool.query<TaxonomyRef>(
      `SELECT id, name, slug FROM ${QUERIES[this.kind].table} WHERE slug = $1`,
      [slug],
    );
    return rows[0] ?? null;
  }
}

import type { Pool } from 'pg';
import type { AuthorPost, AuthorPostRepository } from '../../core/domain/Post';

// A diferencia de PostgresPostRepository, aquí no se filtra por status: el autor ve sus borradores
const SELECT_AUTHOR_POST = `
  SELECT p.id, p.slug, p.title, p.status,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug
    FROM posts p
    JOIN categories c ON c.id = p.category_id`;

interface AuthorPostRow {
  id: number;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  category_id: number;
  category_name: string;
  category_slug: string;
}

function toAuthorPost(row: AuthorPostRow): AuthorPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
  };
}

export class PostgresAuthorPostRepository implements AuthorPostRepository {
  constructor(private readonly pool: Pool) {}

  async listAll(): Promise<AuthorPost[]> {
    const { rows } = await this.pool.query<AuthorPostRow>(`${SELECT_AUTHOR_POST} ORDER BY p.title, p.id`);
    return rows.map(toAuthorPost);
  }

  async assignCategory(postId: number, categoryId: number): Promise<AuthorPost | null> {
    // category_id es una sola columna: asignar la nueva categoría quita la anterior (spec.md, HU-08)
    const { rowCount } = await this.pool.query('UPDATE posts SET category_id = $2 WHERE id = $1', [postId, categoryId]);
    if (!rowCount) return null;

    const { rows } = await this.pool.query<AuthorPostRow>(`${SELECT_AUTHOR_POST} WHERE p.id = $1`, [postId]);
    return rows[0] ? toAuthorPost(rows[0]) : null;
  }
}

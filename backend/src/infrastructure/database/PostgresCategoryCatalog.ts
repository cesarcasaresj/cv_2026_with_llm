import type { Pool } from 'pg';
import type { CategoryCatalog, CategoryDeletion, ManagedCategory, TaxonomyRef } from '../../core/domain/Taxonomy';
import { ConflictError } from '../../core/domain/errors';

// LEFT JOIN: el autor ve también las categorías vacías, y el conteo incluye los borradores
const SELECT_WITH_COUNT = `
  SELECT c.id, c.name, c.slug, COUNT(p.id) AS post_count
    FROM categories c
    LEFT JOIN posts p ON p.category_id = c.id`;

interface CategoryRow extends TaxonomyRef {
  post_count: string;
}

function toCategory(row: CategoryRow): ManagedCategory {
  // COUNT llega como texto desde Postgres, por eso se convierte con Number()
  return { id: row.id, name: row.name, slug: row.slug, postCount: Number(row.post_count) };
}

/** Código de Postgres para una restricción UNIQUE violada. */
const UNIQUE_VIOLATION = '23505';
/** Código de Postgres para una clave foránea violada (la categoría aún tiene artículos). */
const FOREIGN_KEY_VIOLATION = '23503';

function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === code;
}

/** Si dos peticiones crean el mismo nombre a la vez, el índice único de la base decide. */
function asConflict(error: unknown): never {
  if (hasCode(error, UNIQUE_VIOLATION)) throw new ConflictError('Ya existe una categoría con ese nombre.');
  throw error;
}

export class PostgresCategoryCatalog implements CategoryCatalog {
  constructor(private readonly pool: Pool) {}

  async listAll(): Promise<ManagedCategory[]> {
    const { rows } = await this.pool.query<CategoryRow>(`${SELECT_WITH_COUNT} GROUP BY c.id ORDER BY c.name`);
    return rows.map(toCategory);
  }

  async findById(id: number): Promise<ManagedCategory | null> {
    const { rows } = await this.pool.query<CategoryRow>(`${SELECT_WITH_COUNT} WHERE c.id = $1 GROUP BY c.id`, [id]);
    return rows[0] ? toCategory(rows[0]) : null;
  }

  async findConflict(name: string, slug: string, exceptId?: number): Promise<TaxonomyRef | null> {
    const { rows } = await this.pool.query<TaxonomyRef>(
      `SELECT id, name, slug FROM categories
        WHERE (lower(name) = lower($1) OR slug = $2) AND ($3::int IS NULL OR id <> $3)
        LIMIT 1`,
      [name, slug, exceptId ?? null],
    );
    return rows[0] ?? null;
  }

  async create(name: string, slug: string): Promise<ManagedCategory> {
    try {
      const { rows } = await this.pool.query<TaxonomyRef>(
        'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug',
        [name, slug],
      );
      return { ...rows[0], postCount: 0 };
    } catch (error) {
      return asConflict(error);
    }
  }

  async rename(id: number, name: string, slug: string): Promise<ManagedCategory | null> {
    try {
      const { rowCount } = await this.pool.query('UPDATE categories SET name = $2, slug = $3 WHERE id = $1', [
        id,
        name,
        slug,
      ]);
      return rowCount ? this.findById(id) : null;
    } catch (error) {
      return asConflict(error);
    }
  }

  async delete(id: number): Promise<CategoryDeletion> {
    // La clave foránea posts.category_id impide borrar una categoría con artículos (decisión C).
    // Se comprueba antes para dar un mensaje claro, y la base lo garantiza aunque haya concurrencia.
    try {
      const { rows } = await this.pool.query<{ found: boolean; in_use: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM categories WHERE id = $1) AS found,
                EXISTS (SELECT 1 FROM posts WHERE category_id = $1) AS in_use`,
        [id],
      );
      if (!rows[0].found) return 'not-found';
      if (rows[0].in_use) return 'in-use';

      const { rowCount } = await this.pool.query('DELETE FROM categories WHERE id = $1', [id]);
      return rowCount ? 'deleted' : 'not-found';
    } catch (error) {
      if (hasCode(error, FOREIGN_KEY_VIOLATION)) return 'in-use';
      throw error;
    }
  }
}

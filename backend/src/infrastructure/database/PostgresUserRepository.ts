import type { Pool } from 'pg';
import type { User, UserRepository, UserWithPassword } from '../../core/domain/User';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
}

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const { rows } = await this.pool.query<UserRow>(
      'SELECT id, email, password_hash FROM users WHERE lower(email) = lower($1)',
      [email],
    );
    const row = rows[0];
    return row ? { id: row.id, email: row.email, passwordHash: row.password_hash } : null;
  }

  async findById(id: number): Promise<User | null> {
    const { rows } = await this.pool.query<{ id: number; email: string }>(
      'SELECT id, email FROM users WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  }

  async saveAccount(email: string, passwordHash: string, displayName?: string): Promise<User> {
    const { rows } = await this.pool.query<{ id: number; email: string }>(
      `INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3)
       ON CONFLICT ((lower(email))) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             display_name  = COALESCE(EXCLUDED.display_name, users.display_name)
       RETURNING id, email`,
      [email, passwordHash, displayName ?? null],
    );
    return rows[0];
  }
}

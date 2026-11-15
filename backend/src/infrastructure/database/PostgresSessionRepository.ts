import type { Pool } from 'pg';
import type { SessionRepository } from '../../core/domain/Session';

export class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(userId: number, expiresAt: Date): Promise<string> {
    const { rows } = await this.pool.query<{ id: string }>(
      'INSERT INTO sessions (user_id, expires_at) VALUES ($1, $2) RETURNING id',
      [userId, expiresAt],
    );
    return rows[0].id;
  }

  async findActiveUserId(sessionId: string): Promise<number | null> {
    // Un id que no es UUID no puede existir: Postgres lo rechaza, y se trata como sesión inexistente
    if (!UUID_PATTERN.test(sessionId)) return null;

    const { rows } = await this.pool.query<{ user_id: number }>(
      `SELECT user_id FROM sessions
        WHERE id = $1 AND revoked_at IS NULL AND expires_at > now()`,
      [sessionId],
    );
    return rows[0]?.user_id ?? null;
  }

  async revoke(sessionId: string): Promise<void> {
    if (!UUID_PATTERN.test(sessionId)) return;

    await this.pool.query('UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL', [
      sessionId,
    ]);
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

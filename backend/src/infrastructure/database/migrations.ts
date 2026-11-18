// Migraciones de la base (db/init/*.sql), cada una una sola vez.
// En local, Docker ejecuta db/init al crear el contenedor. En un hosting no hay Docker: el backend las aplica
// al arrancar (RUN_MIGRATIONS_ON_START=true) o con `npm run db:migrate`.
//
// - La tabla schema_migrations recuerda cuáles ya se aplicaron.
// - Cada archivo va en su propia transacción: o se aplica entero o no se aplica.
// - Un candado de PostgreSQL (advisory lock) evita que dos procesos migren a la vez.
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool } from 'pg';

/** Número fijo del candado: cualquier proceso de esta aplicación usa el mismo. */
const MIGRATION_LOCK = 2026_11_18;

export interface MigrationOptions {
  /** true: marca los archivos como aplicados sin ejecutarlos (bases que ya estaban al día). */
  baseline?: boolean;
  log?: (message: string) => void;
}

/** Aplica, en orden de nombre, los archivos .sql de `directory` que falten. Devuelve los aplicados. */
export async function runMigrations(pool: Pool, directory: string, options: MigrationOptions = {}): Promise<string[]> {
  const log = options.log ?? (() => undefined);
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  const client = await pool.connect();
  const applied: string[] = [];

  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK]);
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
    );
    const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const done = new Set(rows.map((row) => row.name));

    for (const file of files.filter((name) => !done.has(name))) {
      await client.query('BEGIN');
      try {
        if (!options.baseline) await client.query(await readFile(join(directory, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`MIGRATION_FAILED en ${file}: ${error instanceof Error ? error.message : 'error desconocido'}`);
      }
      applied.push(file);
      log(`${options.baseline ? '· marcada' : '✓ aplicada'} ${file}`);
    }
    return applied;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK]).catch(() => undefined);
    client.release();
  }
}

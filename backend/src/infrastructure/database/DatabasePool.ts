import pg from 'pg';
import type { VaultClient } from '../security/VaultClient';

export async function createDatabasePool(vault: VaultClient, secretPath: string): Promise<pg.Pool> {
  const credentials = await vault.readSecret(secretPath);

  return new pg.Pool({
    host: credentials.host,
    port: Number(credentials.port),
    database: credentials.database,
    user: credentials.username,
    password: credentials.password,
    max: 10,
  });
}

import pg from 'pg';
import type { SecretStore } from '../security/SecretStore';

export async function createDatabasePool(secrets: SecretStore, secretPath: string): Promise<pg.Pool> {
  const credentials = await secrets.readSecret(secretPath);

  return new pg.Pool({
    host: credentials.host,
    port: Number(credentials.port),
    database: credentials.database,
    user: credentials.username,
    password: credentials.password,
    max: 10,
  });
}

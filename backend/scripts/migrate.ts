// Aplica las migraciones pendientes de db/init (ver src/infrastructure/database/migrations.ts).
// Uso:   npm run db:migrate                     (base local)
//        npm run prod -- scripts/migrate.ts     (base del hosting, por el túnel SSH: DEPLOY.md)
//        ... -- --baseline                      marca todo como aplicado sin ejecutarlo (base que ya estaba al día)

import { resolve } from 'node:path';
import { createSecretStore, secretPaths } from '../src/infrastructure/security/SecretStore';
import { createDatabasePool } from '../src/infrastructure/database/DatabasePool';
import { runMigrations } from '../src/infrastructure/database/migrations';

async function main(): Promise<void> {
  const pool = await createDatabasePool(createSecretStore(), secretPaths().database);
  try {
    const applied = await runMigrations(pool, resolve(import.meta.dirname, '../db/init'), {
      baseline: process.argv.includes('--baseline'),
      log: console.log,
    });
    console.log(applied.length ? `\n${applied.length} migraciones.` : 'La base ya estaba al día.');
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido');
  process.exit(1);
});

// Carga el perfil de la portada desde content/perfil/perfil.json, en español e inglés (spec.md, HU-14, HU-15 y HU-18).
// Uso:   npm run load:profile [-- --file ruta/al/perfil.json]
//
// - Si algo no se entiende, no se escribe nada y se listan los errores.
// - Reemplaza nombre, titular, ubicación y "Acerca de mí" en una sola transacción.
// - La experiencia solo se reemplaza si el archivo trae "experience"; si no, queda la que ya estaba.
// - La actualidad (publicaciones de LinkedIn) no se toca: sigue llegando con npm run load:linkedin.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { VaultClient } from '../src/infrastructure/security/VaultClient';
import { createDatabasePool } from '../src/infrastructure/database/DatabasePool';
import { readProfileFile } from './profile/profileFile';

const DEFAULT_FILE = '../content/perfil/perfil.json';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  // 1. Leer y validar antes de conectar con la base
  const path = resolve(argument('--file') ?? DEFAULT_FILE);
  let data: unknown;
  try {
    data = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    throw new Error(`No pude leer ${path} como JSON`);
  }
  const result = readProfileFile(data);
  if (!result.ok) throw new Error(`No se cargó nada. Corrige estos datos:\n  - ${result.errors.join('\n  - ')}`);
  const { profile } = result;

  // 2. Guardar todo en una transacción: o se reemplaza el perfil completo o no cambia nada
  const vault = new VaultClient(requiredEnv('VAULT_ADDR'), requiredEnv('VAULT_TOKEN'));
  const pool = await createDatabasePool(vault, requiredEnv('VAULT_POSTS_DB_PATH'));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO profile (id, full_name, location, headline, headline_en, summary, summary_en, updated_at)
       VALUES (1, $1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, location = EXCLUDED.location,
         headline = EXCLUDED.headline, headline_en = EXCLUDED.headline_en,
         summary = EXCLUDED.summary, summary_en = EXCLUDED.summary_en, updated_at = now()`,
      [profile.name, profile.location, profile.headline.es, profile.headline.en, profile.summary.es, profile.summary.en],
    );

    if (profile.experience) {
      await client.query('DELETE FROM positions');
      for (const position of profile.experience) {
        await client.query(
          `INSERT INTO positions (company, location, started_on, finished_on, title, title_en, description, description_en, scene)
           VALUES ($1, $2, ($3 || '-01')::date, ($4 || '-01')::date, $5, $6, $7, $8, $9)`,
          [
            position.company,
            position.location,
            position.startedOn,
            position.finishedOn,
            position.title.es,
            position.title.en,
            position.description?.es ?? null,
            position.description?.en ?? null,
            position.scene,
          ],
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`✓ Perfil: ${profile.name}`);
  console.log(`  es: ${profile.headline.es}`);
  console.log(`  en: ${profile.headline.en ?? '(sin traducir: se mostrará en español)'}`);
  console.log(
    profile.experience
      ? `✓ Experiencia: ${profile.experience.length} puestos`
      : '· Experiencia: sin cambios (el archivo no trae "experience")',
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido');
  process.exit(1);
});

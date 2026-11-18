// Carga el perfil de la portada desde la exportación oficial de LinkedIn (spec.md, HU-14 a HU-17).
// Uso:   npm run load:linkedin -- --dir C:\ruta\a\la\exportacion [--max 6]
//
// LinkedIn no ofrece una API pública para leer perfiles ni publicaciones, y extraer los datos de la web
// incumple sus condiciones. La vía oficial es "Ajustes → Privacidad de datos → Obtener una copia de tus datos":
// el ZIP trae Profile.csv, Positions.csv y Shares.csv. Este script lee solo los campos públicos.
//
// - Si algo no se entiende, no se escribe nada y se listan los errores.
// - Cada carga reemplaza el perfil, la experiencia y la actualidad anteriores (en una sola transacción).

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createSecretStore, secretPaths } from '../src/infrastructure/security/SecretStore';
import { createDatabasePool } from '../src/infrastructure/database/DatabasePool';
import { readLinkedinExport } from './linkedin/linkedinExport';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function readOptional(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const dirArgument = argument('--dir');
  if (!dirArgument) {
    throw new Error('Indica la carpeta de la exportación: npm run load:linkedin -- --dir C:\\ruta\\exportacion');
  }
  const dir = resolve(dirArgument);
  const maxUpdates = Number(argument('--max') ?? 6);
  if (!Number.isInteger(maxUpdates) || maxUpdates < 0 || maxUpdates > 50) throw new Error('--max debe ser un número de 0 a 50');

  // 1. Leer y validar antes de conectar con la base
  const profileCsv = await readOptional(join(dir, 'Profile.csv'));
  const positionsCsv = await readOptional(join(dir, 'Positions.csv'));
  if (!profileCsv || !positionsCsv) throw new Error(`No encuentro Profile.csv y Positions.csv en ${dir}`);
  const sharesCsv = await readOptional(join(dir, 'Shares.csv'));

  const result = readLinkedinExport({ profile: profileCsv, positions: positionsCsv, shares: sharesCsv }, maxUpdates);
  if (!result.ok) throw new Error(`No se cargó nada. Corrige estos datos:\n  - ${result.errors.join('\n  - ')}`);
  const { profile } = result;

  // 2. Guardar todo en una transacción: o se reemplaza el perfil completo o no cambia nada
  const pool = await createDatabasePool(createSecretStore(), secretPaths().database);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO profile (id, full_name, headline, location, summary, updated_at)
       VALUES (1, $1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, headline = EXCLUDED.headline,
         location = EXCLUDED.location, summary = EXCLUDED.summary, updated_at = now(),
         -- LinkedIn exporta un solo idioma: la traducción anterior ya no corresponde al texto nuevo
         headline_en = NULL, summary_en = NULL`,
      [profile.fullName, profile.headline, profile.location, profile.summary],
    );

    await client.query('DELETE FROM positions');
    for (const position of profile.positions) {
      await client.query(
        `INSERT INTO positions (company, title, location, description, started_on, finished_on)
         VALUES ($1, $2, $3, $4, ($5 || '-01')::date, ($6 || '-01')::date)`,
        [position.company, position.title, position.location, position.description, position.startedOn, position.finishedOn],
      );
    }

    await client.query('DELETE FROM profile_updates');
    for (const update of profile.updates) {
      await client.query('INSERT INTO profile_updates (published_at, text, url) VALUES ($1, $2, $3)', [
        update.publishedAt,
        update.text,
        update.url,
      ]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`✓ Perfil: ${profile.fullName} — ${profile.headline}`);
  console.log(`✓ Experiencia: ${profile.positions.length} puestos`);
  console.log(`✓ Actualidad: ${profile.updates.length} publicaciones (${result.skippedUpdates} omitidas: solo contactos o sin texto)`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido');
  process.exit(1);
});

// Crea o actualiza la cuenta del autor (spec.md, pregunta abierta 3: el registro público queda fuera).
// Uso:   $env:AUTHOR_PASSWORD = "..."; $env:AUTHOR_NAME = "Nombre Apellido"; npm run create:user -- correo@ejemplo.com
// La contraseña se lee del entorno para que no quede en el historial de la terminal ni en el código.
// AUTHOR_NAME es el nombre que se publica en los artículos (el correo nunca se muestra); es opcional al cambiar la contraseña.

import { VaultClient } from '../src/infrastructure/security/VaultClient';
import { createDatabasePool } from '../src/infrastructure/database/DatabasePool';
import { PostgresUserRepository } from '../src/infrastructure/database/PostgresUserRepository';
import { ScryptPasswordHasher } from '../src/infrastructure/security/ScryptPasswordHasher';

const MIN_PASSWORD_LENGTH = 12;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.env.AUTHOR_PASSWORD;

  if (!email || !email.includes('@')) {
    throw new Error('Indica el correo: npm run create:user -- correo@ejemplo.com');
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Define AUTHOR_PASSWORD con al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const vault = new VaultClient(requiredEnv('VAULT_ADDR'), requiredEnv('VAULT_TOKEN'));
  const pool = await createDatabasePool(vault, requiredEnv('VAULT_POSTS_DB_PATH'));

  try {
    const passwordHash = await new ScryptPasswordHasher().hash(password);
    const displayName = process.env.AUTHOR_NAME?.trim() || undefined;
    const user = await new PostgresUserRepository(pool).saveAccount(email, passwordHash, displayName);
    console.log(`Cuenta lista: ${user.email} (id ${user.id}). La contraseña no se muestra.`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Error desconocido');
  process.exit(1);
});

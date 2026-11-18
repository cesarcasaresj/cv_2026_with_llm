// De dónde salen los secretos (constitution.md, sección 2).
// - "vault" (por defecto): HashiCorp Vault, siempre en desarrollo y donde el hosting lo permita.
// - "env": variables de entorno del panel del hosting. Es la excepción escrita en la constitución para
//   hostings compartidos (cPanel), donde no se puede correr Vault. Los valores nunca están en el código ni en git.
import { VaultClient } from './VaultClient';

export type Secret = Record<string, string>;

/** Lo único que el resto del backend necesita saber: leer un secreto por su ruta. */
export interface SecretStore {
  readSecret(path: string): Promise<Secret>;
}

/**
 * Secretos en variables de entorno. La ruta decide el prefijo: su último tramo en mayúsculas.
 *
 *   ruta "cv-app/database" → DATABASE_HOST, DATABASE_PORT, DATABASE_PASSWORD… → { host, port, password… }
 *   ruta "cv-app/jwt"      → JWT_SIGNING_KEY                                   → { signing_key }
 */
export class EnvSecretStore implements SecretStore {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  async readSecret(path: string): Promise<Secret> {
    const prefix = `${envName(path.split('/').pop() ?? path)}_`;
    const secret: Secret = {};
    for (const [name, value] of Object.entries(this.env)) {
      if (name.startsWith(prefix) && value) secret[name.slice(prefix.length).toLowerCase()] = value;
    }
    // Como con Vault, el error dice qué falta, nunca un valor
    if (Object.keys(secret).length === 0) {
      throw new Error(`SECRET_MISSING: no hay variables ${prefix}* para la ruta ${path}`);
    }
    return secret;
  }
}

/** "cv-app" → "CV_APP": solo letras, números y guion bajo. */
function envName(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function requiredEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

/** El almacén que indique SECRETS_PROVIDER ("vault" si no se indica). */
export function createSecretStore(env: NodeJS.ProcessEnv = process.env): SecretStore {
  const provider = env.SECRETS_PROVIDER ?? 'vault';
  if (provider === 'env') return new EnvSecretStore(env);
  if (provider === 'vault') return new VaultClient(requiredEnv(env, 'VAULT_ADDR'), requiredEnv(env, 'VAULT_TOKEN'));
  throw new Error(`SECRETS_PROVIDER no válido: "${provider}". Usa "vault" o "env".`);
}

/** Rutas de los secretos del sistema. Con SECRETS_PROVIDER=env deciden el prefijo de las variables. */
export function secretPaths(env: NodeJS.ProcessEnv = process.env): { database: string; jwt: string } {
  return {
    database: env.VAULT_POSTS_DB_PATH ?? 'cv-app/database',
    jwt: env.VAULT_JWT_PATH ?? 'cv-app/jwt',
  };
}

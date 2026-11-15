import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { PasswordHasher } from '../../core/domain/Session';

// Parámetros de scrypt (recomendación OWASP). Cambiarlos invalida los hashes existentes.
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

/** Formato guardado: `<salt en base64>:<clave derivada en base64>`. */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await deriveKey(password, salt);
    return `${salt.toString('base64')}:${key.toString('base64')}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [saltBase64, keyBase64] = stored.split(':');
    if (!saltBase64 || !keyBase64) return false;

    const expected = Buffer.from(keyBase64, 'base64');
    const actual = await deriveKey(password, Buffer.from(saltBase64, 'base64'));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

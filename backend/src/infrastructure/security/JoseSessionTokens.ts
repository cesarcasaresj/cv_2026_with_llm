import { SignJWT, jwtVerify } from 'jose';
import type { SessionTokens } from '../../core/domain/Session';
import { SESSION_MAX_AGE_SECONDS } from '../../core/domain/Session';

/**
 * JWT firmado con HS256. El token solo dice a qué sesión pertenece (sub = id de la fila en `sessions`);
 * la validez real la decide la base de datos. La clave viene de Vault (secret/cv-app/jwt).
 */
export class JoseSessionTokens implements SessionTokens {
  private readonly key: Uint8Array;

  constructor(signingKey: string) {
    this.key = new TextEncoder().encode(signingKey);
  }

  async issue(sessionId: string): Promise<string> {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(sessionId)
      .setIssuedAt()
      .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
      .sign(this.key);
  }

  async verify(token: string): Promise<string | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      // Firma incorrecta, token vencido o mal formado: en todos los casos no hay sesión
      return null;
    }
  }
}

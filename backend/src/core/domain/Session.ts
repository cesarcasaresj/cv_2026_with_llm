/** Duración de la sesión. La cookie, el JWT y la fila en `sessions` usan el mismo límite. */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/** Puerto: la implementación concreta (scrypt) vive en infrastructure/security. */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

/** Puerto: sesiones guardadas en la base, para poder revocarlas en el servidor (spec.md, HU-03). */
export interface SessionRepository {
  /** Crea una sesión y devuelve su id. */
  create(userId: number, expiresAt: Date): Promise<string>;
  /** Id del usuario si la sesión existe, no está revocada y no ha vencido; si no, null. */
  findActiveUserId(sessionId: string): Promise<number | null>;
  revoke(sessionId: string): Promise<void>;
}

/** Puerto: la implementación concreta (JWT firmado con la clave de Vault) vive en infrastructure/security. */
export interface SessionTokens {
  issue(sessionId: string): Promise<string>;
  /** Id de la sesión si la firma es válida y el token no ha vencido; si no, null. */
  verify(token: string): Promise<string | null>;
}

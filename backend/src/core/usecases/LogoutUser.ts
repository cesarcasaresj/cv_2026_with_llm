import type { SessionRepository, SessionTokens } from '../domain/Session';

/**
 * Revoca la sesión del token (spec.md, HU-03). Si el token no es válido no hay nada que revocar,
 * y aun así el logout se considera correcto: el objetivo es que la sesión quede cerrada.
 */
export class LogoutUser {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: SessionTokens,
  ) {}

  async execute(token: string | undefined): Promise<void> {
    if (!token) return;

    const sessionId = await this.tokens.verify(token);
    if (sessionId) {
      await this.sessions.revoke(sessionId);
    }
  }
}

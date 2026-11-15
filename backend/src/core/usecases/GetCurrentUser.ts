import type { SessionRepository, SessionTokens } from '../domain/Session';
import type { User, UserRepository } from '../domain/User';
import { UnauthorizedError } from '../domain/errors';

/** Convierte el token de la cookie en el usuario de la sesión (spec.md, HU-04). */
export class GetCurrentUser {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: SessionTokens,
  ) {}

  async execute(token: string | undefined): Promise<User> {
    if (!token) throw new UnauthorizedError();

    const sessionId = await this.tokens.verify(token);
    if (!sessionId) throw new UnauthorizedError();

    // La sesión debe seguir activa en la base: un logout la revoca aunque el JWT no haya vencido
    const userId = await this.sessions.findActiveUserId(sessionId);
    if (userId === null) throw new UnauthorizedError();

    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();

    return user;
  }
}

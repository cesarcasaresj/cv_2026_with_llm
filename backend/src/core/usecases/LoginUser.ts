import { SESSION_MAX_AGE_SECONDS, type PasswordHasher, type SessionRepository, type SessionTokens } from '../domain/Session';
import type { User, UserRepository } from '../domain/User';
import { UnauthorizedError, ValidationError } from '../domain/errors';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: User;
  token: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export class LoginUser {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionRepository,
    private readonly tokens: SessionTokens,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || input.password.length === 0) {
      throw new ValidationError('Revisa el correo y la contraseña.');
    }

    const account = await this.users.findByEmail(email);
    // Se compara siempre, exista o no el correo, para que el tiempo de respuesta no revele qué cuentas existen
    const hash = account?.passwordHash ?? (await this.getDummyHash());
    const passwordMatches = await this.hasher.verify(input.password, hash);

    if (!account || !passwordMatches) {
      throw new UnauthorizedError('Correo o contraseña incorrectos.');
    }

    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
    const sessionId = await this.sessions.create(account.id, expiresAt);
    const user: User = { id: account.id, email: account.email };
    return { user, token: await this.tokens.issue(sessionId) };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash('contraseña-ficticia-para-igualar-tiempos');
    return this.dummyHash;
  }
}

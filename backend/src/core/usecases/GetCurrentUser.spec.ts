import { describe, expect, it } from 'vitest';
import { GetCurrentUser } from './GetCurrentUser';
import { UnauthorizedError } from '../domain/errors';
import type { SessionRepository, SessionTokens } from '../domain/Session';
import type { UserRepository } from '../domain/User';

const tokens: SessionTokens = {
  issue: async () => 'unused',
  verify: async (token) => (token === 'valido' ? 'sesion-1' : null),
};

const users: UserRepository = {
  findByEmail: async () => null,
  findById: async (id) => (id === 1 ? { id: 1, email: 'autor@ejemplo.com' } : null),
  saveAccount: async (email) => ({ id: 1, email }),
};

// La sesión "sesion-1" está activa solo mientras no esté revocada
let revoked = false;
const sessions: SessionRepository = {
  create: async () => 'unused',
  findActiveUserId: async (sessionId) => (sessionId === 'sesion-1' && !revoked ? 1 : null),
  revoke: async () => {
    revoked = true;
  },
};

describe('GetCurrentUser', () => {
  it('con un token válido y sesión activa devuelve el usuario', async () => {
    const user = await new GetCurrentUser(users, sessions, tokens).execute('valido');

    expect(user).toEqual({ id: 1, email: 'autor@ejemplo.com' });
  });

  it('sin token lanza UnauthorizedError', async () => {
    await expect(new GetCurrentUser(users, sessions, tokens).execute(undefined)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('con un token falso lanza UnauthorizedError', async () => {
    await expect(new GetCurrentUser(users, sessions, tokens).execute('falso')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('con una sesión revocada lanza UnauthorizedError aunque el token sea válido', async () => {
    revoked = true;

    await expect(new GetCurrentUser(users, sessions, tokens).execute('valido')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    revoked = false;
  });
});

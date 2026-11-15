import { describe, expect, it } from 'vitest';
import { LogoutUser } from './LogoutUser';
import type { SessionRepository, SessionTokens } from '../domain/Session';

const tokens: SessionTokens = {
  issue: async () => 'unused',
  verify: async (token) => (token === 'valido' ? 'sesion-1' : null),
};

function recordingSessions(): SessionRepository & { revoked: string[] } {
  const revoked: string[] = [];
  return {
    revoked,
    create: async () => 'unused',
    findActiveUserId: async () => null,
    revoke: async (sessionId) => {
      revoked.push(sessionId);
    },
  };
}

describe('LogoutUser', () => {
  it('con un token válido revoca su sesión', async () => {
    const sessions = recordingSessions();

    await new LogoutUser(sessions, tokens).execute('valido');

    expect(sessions.revoked).toEqual(['sesion-1']);
  });

  it('con un token falso no revoca nada y no falla', async () => {
    const sessions = recordingSessions();

    await expect(new LogoutUser(sessions, tokens).execute('falso')).resolves.toBeUndefined();
    expect(sessions.revoked).toEqual([]);
  });

  it('sin token no hace nada', async () => {
    const sessions = recordingSessions();

    await new LogoutUser(sessions, tokens).execute(undefined);

    expect(sessions.revoked).toEqual([]);
  });
});

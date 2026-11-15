import { describe, expect, it } from 'vitest';
import { LoginUser } from './LoginUser';
import { UnauthorizedError, ValidationError } from '../domain/errors';
import type { PasswordHasher, SessionRepository, SessionTokens } from '../domain/Session';
import type { UserRepository } from '../domain/User';

// Hash falso: "hash:<contraseña>". Así se prueba la lógica sin depender de scrypt.
const hasher: PasswordHasher = {
  hash: async (password) => `hash:${password}`,
  verify: async (password, hash) => hash === `hash:${password}`,
};

const sessions: SessionRepository = {
  create: async () => 'sesion-1',
  findActiveUserId: async () => null,
  revoke: async () => undefined,
};

const tokens: SessionTokens = {
  issue: async (sessionId) => `token-${sessionId}`,
  verify: async () => null,
};

const users: UserRepository = {
  findByEmail: async (email) =>
    email === 'autor@ejemplo.com' ? { id: 1, email, passwordHash: 'hash:secreto' } : null,
  findById: async () => null,
  saveAccount: async (email) => ({ id: 1, email }),
};

describe('LoginUser', () => {
  it('con credenciales válidas devuelve el usuario y un token ligado a la sesión', async () => {
    const result = await new LoginUser(users, hasher, sessions, tokens).execute({
      email: 'Autor@Ejemplo.com',
      password: 'secreto',
    });

    expect(result).toEqual({ user: { id: 1, email: 'autor@ejemplo.com' }, token: 'token-sesion-1' });
  });

  it('con una contraseña incorrecta lanza UnauthorizedError con el mensaje genérico', async () => {
    const attempt = new LoginUser(users, hasher, sessions, tokens).execute({
      email: 'autor@ejemplo.com',
      password: 'otra',
    });

    await expect(attempt).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(attempt).rejects.toThrow('Correo o contraseña incorrectos.');
  });

  it('con un correo que no existe lanza el mismo UnauthorizedError', async () => {
    const attempt = new LoginUser(users, hasher, sessions, tokens).execute({
      email: 'nadie@ejemplo.com',
      password: 'x',
    });

    await expect(attempt).rejects.toThrow('Correo o contraseña incorrectos.');
  });

  it('con un correo mal formado lanza ValidationError', async () => {
    const attempt = new LoginUser(users, hasher, sessions, tokens).execute({ email: 'no-es-correo', password: 'x' });

    await expect(attempt).rejects.toBeInstanceOf(ValidationError);
  });
});

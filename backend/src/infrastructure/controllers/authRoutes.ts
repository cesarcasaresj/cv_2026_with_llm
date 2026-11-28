import { Router } from 'express';
import type { LoginUser } from '../../core/usecases/LoginUser';
import type { GetCurrentUser } from '../../core/usecases/GetCurrentUser';
import type { LogoutUser } from '../../core/usecases/LogoutUser';
import { TooManyRequestsError, UnauthorizedError, ValidationError } from '../../core/domain/errors';
import type { LoginThrottle } from '../security/LoginThrottle';
import { visitorOf } from './visitor';
import type { components } from '../../generated/api';
import { buildSessionCookie, clearSessionCookie, readSessionToken } from './sessionCookie';
import { requireSession, sessionUser } from './requireSession';

type LoginRequest = components['schemas']['LoginRequest'];
type UserResponse = components['schemas']['UserResponse'];

export function authRoutes(
  loginUser: LoginUser,
  getCurrentUser: GetCurrentUser,
  logoutUser: LogoutUser,
  throttle: LoginThrottle,
): Router {
  const router = Router();

  router.post('/login', async (request, response) => {
    const body = (request.body ?? {}) as Partial<LoginRequest>;
    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      throw new ValidationError('Revisa el correo y la contraseña.');
    }

    // Fuerza bruta: tras varios fallos seguidos, el visitante espera cada vez más (LoginThrottle)
    const visitor = visitorOf(request);
    const waitMs = throttle.retryAfterMs(visitor);
    if (waitMs > 0) {
      const seconds = Math.ceil(waitMs / 1000);
      response.setHeader('Retry-After', String(seconds));
      throw new TooManyRequestsError(`Demasiados intentos. Espera ${seconds} segundos antes de volver a intentarlo.`);
    }

    let result;
    try {
      result = await loginUser.execute({ email: body.email, password: body.password });
    } catch (error) {
      if (error instanceof UnauthorizedError) throttle.recordFailure(visitor);
      throw error;
    }
    throttle.recordSuccess(visitor);
    // El token solo viaja en la cookie HttpOnly; nunca en el cuerpo de la respuesta
    response.setHeader('Set-Cookie', buildSessionCookie(result.token));
    const user: UserResponse = result.user;
    response.json(user);
  });

  router.post('/logout', async (request, response) => {
    // Revoca la sesión en el servidor: el token, aunque se haya copiado, deja de valer
    await logoutUser.execute(readSessionToken(request.headers));
    response.setHeader('Set-Cookie', clearSessionCookie());
    response.status(204).end();
  });

  router.get('/me', requireSession(getCurrentUser), (_request, response) => {
    const user: UserResponse = sessionUser(response.locals);
    response.json(user);
  });

  return router;
}

import { Router } from 'express';
import type { LoginUser } from '../../core/usecases/LoginUser';
import type { GetCurrentUser } from '../../core/usecases/GetCurrentUser';
import type { LogoutUser } from '../../core/usecases/LogoutUser';
import { ValidationError } from '../../core/domain/errors';
import type { components } from '../../generated/api';
import { buildSessionCookie, clearSessionCookie, readSessionToken } from './sessionCookie';
import { requireSession, sessionUser } from './requireSession';

type LoginRequest = components['schemas']['LoginRequest'];
type UserResponse = components['schemas']['UserResponse'];

export function authRoutes(
  loginUser: LoginUser,
  getCurrentUser: GetCurrentUser,
  logoutUser: LogoutUser,
): Router {
  const router = Router();

  router.post('/login', async (request, response) => {
    const body = (request.body ?? {}) as Partial<LoginRequest>;
    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      throw new ValidationError('Revisa el correo y la contraseña.');
    }

    const result = await loginUser.execute({ email: body.email, password: body.password });
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

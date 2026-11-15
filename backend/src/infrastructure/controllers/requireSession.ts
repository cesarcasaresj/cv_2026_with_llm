import type { RequestHandler } from 'express';
import type { GetCurrentUser } from '../../core/usecases/GetCurrentUser';
import type { User } from '../../core/domain/User';
import { readSessionToken } from './sessionCookie';

/**
 * Exige una sesión válida para la ruta. Si la hay, deja el usuario en `response.locals.user`.
 * Sin sesión, GetCurrentUser lanza UnauthorizedError y el manejador de errores responde 401.
 */
export function requireSession(getCurrentUser: GetCurrentUser): RequestHandler {
  return async (request, response, next) => {
    response.locals.user = await getCurrentUser.execute(readSessionToken(request.headers));
    next();
  };
}

export function sessionUser(locals: Record<string, unknown>): User {
  return locals.user as User;
}

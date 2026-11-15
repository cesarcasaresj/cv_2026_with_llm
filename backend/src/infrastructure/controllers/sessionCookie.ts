import type { IncomingHttpHeaders } from 'node:http';
import { SESSION_MAX_AGE_SECONDS } from '../../core/domain/Session';

export const SESSION_COOKIE_NAME = 'session';

// spec.md, HU-02: la cookie no es accesible desde JavaScript y solo viaja por HTTPS y en el mismo sitio
const COOKIE_ATTRIBUTES = 'HttpOnly; Secure; SameSite=Strict; Path=/';

export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE_NAME}=${token}; ${COOKIE_ATTRIBUTES}; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

/** Cookie con Max-Age=0: el navegador la borra (spec.md, HU-03). */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; ${COOKIE_ATTRIBUTES}; Max-Age=0`;
}

export function readSessionToken(headers: IncomingHttpHeaders): string | undefined {
  const cookieHeader = headers.cookie ?? '';
  const pair = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));
  return pair?.slice(SESSION_COOKIE_NAME.length + 1) || undefined;
}

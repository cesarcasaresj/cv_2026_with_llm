import type { Request } from 'express';

/**
 * Quién hace la petición, para los límites por visitante (asistente y login).
 *
 * En producción, Caddy reescribe CF-Connecting-IP con la IP real del visitante, y solo la toma
 * de la cabecera de Cloudflare si la petición viene de un rango de Cloudflare (deploy/vps/Caddyfile):
 * nadie puede falsificarla saltándose Cloudflare. En local no hay Caddy y se usa X-Forwarded-For o la IP.
 */
export function visitorOf(request: Request): string {
  const cloudflare = request.headers['cf-connecting-ip'];
  if (typeof cloudflare === 'string' && cloudflare) return cloudflare;
  const forwarded = request.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || request.ip || 'desconocido';
}

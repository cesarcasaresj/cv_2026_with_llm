import { Router, type Request } from 'express';
import type { AskAboutCv } from '../../core/usecases/AskAboutCv';
import { parseLang } from '../../core/usecases/Portfolio';
import { ServiceUnavailableError } from '../../core/domain/errors';
import type { components } from '../../generated/api';

type AssistantStatus = components['schemas']['AssistantStatus'];
type AssistantAnswer = components['schemas']['AssistantAnswer'];

/**
 * Quién pregunta, para el límite por visitante: la IP que informa Cloudflare o Caddy (X-Forwarded-For).
 * Es una aproximación; el tope diario global es el que protege el saldo.
 */
export function visitorOf(request: Request): string {
  const cloudflare = request.headers['cf-connecting-ip'];
  if (typeof cloudflare === 'string' && cloudflare) return cloudflare;
  const forwarded = request.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || request.ip || 'desconocido';
}

/** "Pregúntale a mi CV" (spec.md, HU-24). Sin clave de la API, `ask` es null y el asistente no está disponible. */
export function assistantRoutes(ask: AskAboutCv | null): Router {
  const router = Router();

  router.get('/', (_request, response) => {
    const body: AssistantStatus = { available: ask !== null };
    response.json(body);
  });

  router.post('/questions', async (request, response) => {
    if (!ask) throw new ServiceUnavailableError('El asistente no está disponible.');
    const { lang, messages } = (request.body ?? {}) as { lang?: unknown; messages?: unknown };
    const answer = await ask.execute(visitorOf(request), parseLang(lang), messages);
    const body: AssistantAnswer = { answer };
    response.setHeader('Cache-Control', 'no-store');
    response.json(body);
  });

  return router;
}

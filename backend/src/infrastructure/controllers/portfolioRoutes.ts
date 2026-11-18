import { Router } from 'express';
import { parseLang, type GetProfile, type ListProjects, type ListUpdates } from '../../core/usecases/Portfolio';
import type { components } from '../../generated/api';

type ProfileResponse = components['schemas']['Profile'];
type ProjectResponse = components['schemas']['Project'];
type ProfileUpdateResponse = components['schemas']['ProfileUpdate'];

export interface ProfileLinks {
  github: string | null;
  linkedin: string | null;
}

/** Datos públicos de la portada (spec.md, HU-14 a HU-17). */
export function portfolioRoutes(
  getProfile: GetProfile,
  listProjects: ListProjects,
  listUpdates: ListUpdates,
  links: ProfileLinks,
): Router {
  const router = Router();

  router.get('/profile', async (request, response) => {
    const profile = await getProfile.execute(parseLang(request.query['lang']));
    const body: ProfileResponse = { ...profile, links };
    // La misma URL con otro ?lang= es otra respuesta; Content-Language dice cuál se sirvió
    response.setHeader('Content-Language', profile.lang);
    response.json(body);
  });

  router.get('/projects', async (_request, response) => {
    const projects = await listProjects.execute();
    const body: ProjectResponse[] = projects.map(({ fork: _fork, archived: _archived, pushedAt, ...project }) => ({
      ...project,
      pushedAt: pushedAt.toISOString(),
    }));
    // Los navegadores y el SSR pueden reutilizarla unos minutos; el backend ya la guarda en caché
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.json(body);
  });

  router.get('/updates', async (_request, response) => {
    const updates = await listUpdates.execute();
    const body: ProfileUpdateResponse[] = updates.map((update) => ({
      ...update,
      publishedAt: update.publishedAt.toISOString(),
    }));
    response.json(body);
  });

  return router;
}

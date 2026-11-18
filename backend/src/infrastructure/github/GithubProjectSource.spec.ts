import { describe, expect, it, vi } from 'vitest';
import { CachedProjectSource, GithubProjectSource } from './GithubProjectSource';
import { ServiceUnavailableError } from '../../core/domain/errors';
import type { Project } from '../../core/domain/Profile';

const repo = {
  name: 'cv',
  description: 'Mi CV',
  html_url: 'https://github.com/autor/cv',
  homepage: '',
  language: 'TypeScript',
  stargazers_count: 3,
  forks_count: 1,
  topics: ['angular'],
  pushed_at: '2026-11-01T10:00:00Z',
  fork: false,
  archived: false,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('GithubProjectSource', () => {
  it('convierte la respuesta de GitHub al modelo del dominio', async () => {
    const fetchFn = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => jsonResponse([repo]));

    const [project] = await new GithubProjectSource('autor', fetchFn as typeof fetch).listPublicProjects();

    expect(project).toMatchObject({ name: 'cv', homepage: null, stars: 3, topics: ['angular'] });
    expect(project.pushedAt.toISOString()).toBe('2026-11-01T10:00:00.000Z');
    expect(String(fetchFn.mock.calls[0][0])).toContain('/users/autor/repos');
  });

  it('un error de GitHub se convierte en ServiceUnavailableError', async () => {
    const source = new GithubProjectSource('autor', (async () => jsonResponse({ message: 'rate limit' }, 403)) as typeof fetch);

    await expect(source.listPublicProjects()).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('sin conexión también es ServiceUnavailableError', async () => {
    const source = new GithubProjectSource('autor', (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch);

    await expect(source.listPublicProjects()).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});

describe('CachedProjectSource', () => {
  const projects = [{ name: 'cv' }] as Project[];

  it('reutiliza la respuesta mientras no vence', async () => {
    let now = 0;
    const inner = { listPublicProjects: vi.fn(async () => projects) };
    const cached = new CachedProjectSource(inner, 1000, () => now);

    await cached.listPublicProjects();
    now = 999;
    await cached.listPublicProjects();
    expect(inner.listPublicProjects).toHaveBeenCalledTimes(1);

    now = 1000;
    await cached.listPublicProjects();
    expect(inner.listPublicProjects).toHaveBeenCalledTimes(2);
  });

  it('si GitHub falla después, sirve la copia anterior', async () => {
    let now = 0;
    const inner = { listPublicProjects: vi.fn(async () => projects) };
    const cached = new CachedProjectSource(inner, 1000, () => now);
    await cached.listPublicProjects();

    inner.listPublicProjects.mockRejectedValueOnce(new ServiceUnavailableError('caído'));
    now = 5000;

    expect(await cached.listPublicProjects()).toBe(projects);
  });

  it('sin copia anterior, el error llega al llamador', async () => {
    const inner = { listPublicProjects: async () => Promise.reject(new ServiceUnavailableError('caído')) };

    await expect(new CachedProjectSource(inner, 1000).listPublicProjects()).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it('peticiones simultáneas comparten una sola llamada', async () => {
    const inner = { listPublicProjects: vi.fn(async () => projects) };
    const cached = new CachedProjectSource(inner, 1000);

    await Promise.all([cached.listPublicProjects(), cached.listPublicProjects(), cached.listPublicProjects()]);

    expect(inner.listPublicProjects).toHaveBeenCalledTimes(1);
  });
});

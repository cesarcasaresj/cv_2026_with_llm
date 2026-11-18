import type { Project, ProjectSource } from '../../core/domain/Profile';
import { ServiceUnavailableError } from '../../core/domain/errors';

/** Campos de la API de GitHub que usa la portada (GET /users/{usuario}/repos). */
interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  pushed_at: string;
  fork: boolean;
  archived: boolean;
}

const TIMEOUT_MS = 4000;

/**
 * Repositorios públicos de un usuario desde la API REST de GitHub (spec.md, HU-16).
 * Sin token: 60 peticiones por hora por IP, suficiente con la caché de CachedProjectSource.
 */
export class GithubProjectSource implements ProjectSource {
  constructor(
    private readonly username: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async listPublicProjects(): Promise<Project[]> {
    const url = `https://api.github.com/users/${encodeURIComponent(this.username)}/repos?type=owner&sort=pushed&per_page=100`;
    let response: Response;
    try {
      response = await this.fetchFn(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          // GitHub exige un User-Agent; se usa un nombre genérico, sin datos personales
          'User-Agent': 'cv-portfolio-backend',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new ServiceUnavailableError('No pudimos conectar con GitHub. Intenta de nuevo en unos minutos.');
    }

    if (!response.ok) {
      // El detalle (por ejemplo 403 por límite de peticiones) queda en los logs, no en la respuesta
      console.error(`GitHub respondió ${response.status} al listar repositorios`);
      throw new ServiceUnavailableError('GitHub no está disponible en este momento. Intenta de nuevo en unos minutos.');
    }

    const repos = (await response.json()) as GithubRepo[];
    return repos.map((repo) => ({
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage || null,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics ?? [],
      pushedAt: new Date(repo.pushed_at),
      fork: repo.fork,
      archived: repo.archived,
    }));
  }
}

/**
 * Guarda la última respuesta buena durante `ttlMs`. Si GitHub falla después, se sigue
 * sirviendo la copia anterior (mejor un dato de hace un rato que una sección vacía).
 */
export class CachedProjectSource implements ProjectSource {
  private cached: { projects: Project[]; at: number } | null = null;
  private inFlight: Promise<Project[]> | null = null;

  constructor(
    private readonly source: ProjectSource,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async listPublicProjects(): Promise<Project[]> {
    if (this.cached && this.now() - this.cached.at < this.ttlMs) return this.cached.projects;

    // Varias peticiones a la vez comparten una sola llamada a GitHub
    this.inFlight ??= this.refresh().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async refresh(): Promise<Project[]> {
    try {
      const projects = await this.source.listPublicProjects();
      this.cached = { projects, at: this.now() };
      return projects;
    } catch (error) {
      if (this.cached) return this.cached.projects;
      throw error;
    }
  }
}

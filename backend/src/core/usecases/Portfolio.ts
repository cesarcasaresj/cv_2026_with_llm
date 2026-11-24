// Datos de la portada (spec.md, HU-14 a HU-17).
import { BASE_LANG, isLang, type Lang, type Profile, type ProfileRepository, type ProfileUpdate, type Project, type ProjectSource } from '../domain/Profile';
import { NotFoundError, ValidationError } from '../domain/errors';

export interface PublicProfile extends Omit<Profile, 'summary'> {
  /** "Acerca de mí" en párrafos, sin líneas vacías. */
  about: string[];
}

/** Separa el resumen en párrafos: LinkedIn separa con saltos de línea, simples o dobles. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/** El idioma pedido en la URL: sin indicar, el base; uno que no existe es un error (HU-18). */
export function parseLang(value: unknown): Lang {
  if (value === undefined) return BASE_LANG;
  if (!isLang(value)) throw new ValidationError('Idioma no disponible. Usa "es" o "en".');
  return value;
}

export class GetProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(lang: Lang = BASE_LANG): Promise<PublicProfile> {
    const profile = await this.profiles.getProfile(lang);
    if (!profile) throw new NotFoundError('Todavía no hay un perfil cargado.');

    const { summary, ...rest } = profile;
    // Puesto actual primero; después, del más reciente al más antiguo (HU-15)
    const experience = [...profile.experience].sort(
      (a, b) =>
        Number(b.finishedOn === null) - Number(a.finishedOn === null) ||
        (b.finishedOn ?? '').localeCompare(a.finishedOn ?? '') ||
        b.startedOn.localeCompare(a.startedOn),
    );
    return { ...rest, experience, about: paragraphs(summary) };
  }
}

export const MAX_PROJECTS = 9;

/** Topic de GitHub con el que el autor marca sus proyectos destacados. */
export const FEATURED_TOPIC = 'portfolio';

/**
 * Proyectos propios y activos: sin forks ni archivados, del último actualizado al más antiguo (HU-16).
 * Si alguno lleva el topic "portfolio", solo se muestran esos (los destacados); si ninguno lo lleva, todos.
 */
export class ListProjects {
  constructor(private readonly source: ProjectSource) {}

  async execute(): Promise<Project[]> {
    const own = (await this.source.listPublicProjects()).filter((project) => !project.fork && !project.archived);
    const featured = own.filter((project) => project.topics.includes(FEATURED_TOPIC));
    return (featured.length > 0 ? featured : own)
      .sort((a, b) => b.pushedAt.getTime() - a.pushedAt.getTime())
      .slice(0, MAX_PROJECTS);
  }
}

export const MAX_UPDATES = 6;

export class ListUpdates {
  constructor(private readonly profiles: ProfileRepository) {}

  execute(): Promise<ProfileUpdate[]> {
    return this.profiles.listUpdates(MAX_UPDATES);
  }
}

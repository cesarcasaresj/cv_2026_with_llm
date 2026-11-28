/** Idiomas del sitio (spec.md, HU-18). El español es el base: siempre existe; el inglés es opcional. */
export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const BASE_LANG: Lang = 'es';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

/** Dioramas del viaje de la experiencia (spec.md, HU-20). Misma lista que LevelScene en el contrato. */
export const LEVEL_SCENES = ['tower', 'vanity', 'exchange', 'lab', 'antenna', 'billboard', 'phone', 'payment', 'desk'] as const;
export type LevelScene = (typeof LEVEL_SCENES)[number];

export function isLevelScene(value: unknown): value is LevelScene {
  return typeof value === 'string' && (LEVEL_SCENES as readonly string[]).includes(value);
}

/** Fecha de LinkedIn: solo año y mes ("2024-03"). */
export type YearMonth = string;

export interface Position {
  company: string;
  title: string;
  location: string | null;
  startedOn: YearMonth;
  /** null si es el puesto actual. */
  finishedOn: YearMonth | null;
  description: string | null;
  /** Diorama del puesto; null si no se eligió. */
  scene: LevelScene | null;
  /** Cliente para el que se trabajó (consultoras); null si no aplica. */
  client: string | null;
  /** Logros del puesto, en viñetas (HU-26). */
  highlights: string[];
}

/** Habilidades por área, educación e idiomas: el resto del CV (spec.md, HU-26). */
export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Education {
  degree: string;
  school: string;
  year: number | null;
}

export interface SpokenLanguage {
  name: string;
  level: string;
}

export interface CvDetails {
  skills: SkillGroup[];
  education: Education[];
  languages: SpokenLanguage[];
  /** Datos clave para el inicio (HU-28): cortos y con cifras, por ejemplo "7+ años". */
  facts: string[];
  /** Disponibilidad, por ejemplo "Remoto LATAM · horario compatible con EE. UU."; null si no se indica. */
  availability: string | null;
}

export const EMPTY_CV_DETAILS: CvDetails = { skills: [], education: [], languages: [], facts: [], availability: null };

/** Perfil público del autor (spec.md, HU-14 y HU-15). Nunca incluye el correo ni otros datos privados. */
export interface Profile {
  /** Idioma en que vienen los textos; el base si se pidió otro y no hay traducción. */
  lang: Lang;
  name: string;
  headline: string;
  location: string | null;
  /** Texto de "Acerca de mí"; los párrafos van separados por líneas en blanco. */
  summary: string;
  experience: Position[];
  skills: SkillGroup[];
  education: Education[];
  languages: SpokenLanguage[];
  facts: string[];
  availability: string | null;
}

export interface ProfileUpdate {
  publishedAt: Date;
  text: string;
  url: string | null;
}

export interface ProfileRepository {
  /** null si todavía no se cargó el perfil. Los textos que falten en `lang` vienen en el idioma base. */
  getProfile(lang: Lang): Promise<Profile | null>;
  /** Publicaciones más recientes primero. */
  listUpdates(limit: number): Promise<ProfileUpdate[]>;
}

/** Repositorio público de GitHub tal como lo describe la API. */
export interface Project {
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  pushedAt: Date;
  fork: boolean;
  archived: boolean;
}

/** Puerto: de dónde salen los proyectos. La implementación (API de GitHub con caché) vive en infrastructure. */
export interface ProjectSource {
  listPublicProjects(): Promise<Project[]>;
}

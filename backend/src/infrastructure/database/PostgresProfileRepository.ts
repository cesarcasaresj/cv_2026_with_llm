import type { Pool } from 'pg';
import {
  EMPTY_CV_DETAILS,
  type CvDetails,
  type Lang,
  type LevelScene,
  type Position,
  type Profile,
  type ProfileRepository,
  type ProfileUpdate,
} from '../../core/domain/Profile';

/** DATE de Postgres → "AAAA-MM" (LinkedIn solo guarda año y mes). */
const YEAR_MONTH = `'YYYY-MM'`;

/**
 * Columna de texto en el idioma pedido. El español es la columna base ("headline");
 * el inglés vive en "headline_en" y, si está vacío, se usa el español.
 * Los nombres de columna son fijos en este archivo: nunca vienen de la petición.
 */
function localized(column: string, lang: Lang): string {
  return lang === 'en' ? `COALESCE(${column}_en, ${column})` : column;
}

export class PostgresProfileRepository implements ProfileRepository {
  constructor(private readonly pool: Pool) {}

  async getProfile(lang: Lang): Promise<Profile | null> {
    const { rows } = await this.pool.query<{
      full_name: string;
      headline: string;
      location: string | null;
      summary: string;
      details: unknown;
      translated: boolean;
    }>(
      `SELECT full_name, location,
              ${localized('headline', lang)} AS headline,
              ${localized('summary', lang)} AS summary,
              ${localized('details', lang)} AS details,
              (headline_en IS NOT NULL OR summary_en IS NOT NULL) AS translated
         FROM profile WHERE id = 1`,
    );
    const profile = rows[0];
    if (!profile) return null;

    const positions = await this.pool.query<{
      company: string;
      title: string;
      location: string | null;
      description: string | null;
      started_on: string;
      finished_on: string | null;
      scene: LevelScene | null;
      client: string | null;
      highlights: string[];
    }>(
      `SELECT company,
              ${localized('client', lang)} AS client,
              ${localized('highlights', lang)} AS highlights,
              ${localized('title', lang)} AS title,
              location,
              ${localized('description', lang)} AS description,
              to_char(started_on, ${YEAR_MONTH}) AS started_on,
              to_char(finished_on, ${YEAR_MONTH}) AS finished_on,
              scene
         FROM positions
        ORDER BY finished_on DESC NULLS FIRST, started_on DESC`,
    );

    const experience: Position[] = positions.rows.map((row) => ({
      company: row.company,
      title: row.title,
      location: row.location,
      startedOn: row.started_on,
      finishedOn: row.finished_on,
      description: row.description,
      scene: row.scene,
      client: row.client,
      highlights: row.highlights ?? [],
    }));

    return {
      // Se avisa del idioma real: "en" solo si de verdad hay traducción
      lang: lang === 'en' && profile.translated ? 'en' : 'es',
      name: profile.full_name,
      headline: profile.headline,
      location: profile.location,
      summary: profile.summary,
      experience,
      ...cvDetails(profile.details),
    };
  }

  async listUpdates(limit: number): Promise<ProfileUpdate[]> {
    const { rows } = await this.pool.query<{ published_at: Date; text: string; url: string | null }>(
      'SELECT published_at, text, url FROM profile_updates ORDER BY published_at DESC LIMIT $1',
      [limit],
    );
    return rows.map((row) => ({ publishedAt: row.published_at, text: row.text, url: row.url }));
  }
}

/** La columna JSONB la escribe load:profile ya validada; aquí solo se descarta lo que no tenga la forma esperada. */
function cvDetails(raw: unknown): CvDetails {
  if (typeof raw !== 'object' || raw === null) return EMPTY_CV_DETAILS;
  const data = raw as Partial<Record<keyof CvDetails, unknown>>;
  const list = <T>(value: unknown, valid: (item: Record<string, unknown>) => boolean): T[] =>
    Array.isArray(value) ? (value.filter((item) => typeof item === 'object' && item !== null && valid(item)) as T[]) : [];
  const isText = (value: unknown) => typeof value === 'string';
  return {
    skills: list(data.skills, (item) => isText(item['group']) && Array.isArray(item['items'])),
    education: list(data.education, (item) => isText(item['degree']) && isText(item['school'])),
    languages: list(data.languages, (item) => isText(item['name']) && isText(item['level'])),
    facts: Array.isArray(data.facts) ? data.facts.filter(isText) : [],
    availability: isText(data.availability) ? (data.availability as string) : null,
  };
}

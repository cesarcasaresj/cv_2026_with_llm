// Lee content/perfil/perfil.json: el perfil de la portada en español e inglés (spec.md, HU-14, HU-15 y HU-18).
// Es la alternativa a la exportación de LinkedIn cuando el texto se quiere escribir a mano y en dos idiomas.
//
// Formato:
// {
//   "name": "Nombre Apellido",
//   "location": "Ciudad" | null,
//   "headline": { "es": "…", "en": "…" },
//   "about":    { "es": ["párrafo", …], "en": ["paragraph", …] },
//   "experience": [                                   ← opcional: si falta, la experiencia actual no se toca
//     { "company": "…", "location": "…" | null, "startedOn": "2021-03", "finishedOn": "2023-08" | null,
//       "title": { "es": "…", "en": "…" }, "description": { "es": "…", "en": "…" } | null,
//       "scene": "tower" | "vanity" | … | null }    ← diorama del viaje de la experiencia (HU-20), opcional
//   ]
// }
// "en" es opcional en cada texto: si falta, la portada en inglés muestra el español.

import { LEVEL_SCENES, isLevelScene, type LevelScene } from '../../src/core/domain/Profile';

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Texto en los dos idiomas; el inglés puede faltar. */
export interface Bilingual<T> {
  es: T;
  en: T | null;
}

export interface FilePosition {
  company: string;
  location: string | null;
  startedOn: string;
  finishedOn: string | null;
  title: Bilingual<string>;
  description: Bilingual<string> | null;
  scene: LevelScene | null;
}

export interface ProfileFile {
  name: string;
  location: string | null;
  headline: Bilingual<string>;
  /** Párrafos unidos con una línea en blanco, como el resumen de LinkedIn. */
  summary: Bilingual<string>;
  /** null: se conserva la experiencia que ya está en la base. */
  experience: FilePosition[] | null;
}

export type ProfileFileResult = { ok: true; profile: ProfileFile } | { ok: false; errors: string[] };

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Lee y valida el archivo. Si algo falla, devuelve todos los errores juntos para corregirlos de una vez. */
export function readProfileFile(data: unknown): ProfileFileResult {
  const errors: string[] = [];

  function text(value: unknown, where: string, { min = 1, max = 5000 } = {}): string {
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
      errors.push(`${where}: debe ser un texto de ${min} a ${max} caracteres`);
      return '';
    }
    return value.trim();
  }

  function optionalText(value: unknown, where: string): string | null {
    return value === null || value === undefined ? null : text(value, where);
  }

  function bilingual<T>(value: unknown, where: string, read: (item: unknown, where: string) => T): Bilingual<T> {
    if (!isObject(value)) {
      errors.push(`${where}: debe ser un objeto { "es": …, "en": … }`);
      return { es: read('', `${where}.es`), en: null };
    }
    return {
      es: read(value['es'], `${where}.es`),
      en: value['en'] === undefined || value['en'] === null ? null : read(value['en'], `${where}.en`),
    };
  }

  function paragraphs(value: unknown, where: string): string {
    if (!Array.isArray(value) || value.length === 0) {
      errors.push(`${where}: debe ser una lista de párrafos`);
      return '';
    }
    return value.map((paragraph, index) => text(paragraph, `${where}[${index}]`)).join('\n\n');
  }

  function month(value: unknown, where: string): string {
    if (typeof value !== 'string' || !YEAR_MONTH.test(value)) {
      errors.push(`${where}: debe tener el formato AAAA-MM, por ejemplo 2021-03`);
      return '';
    }
    return value;
  }

  function position(value: unknown, where: string): FilePosition {
    const item = isObject(value) ? value : {};
    if (!isObject(value)) errors.push(`${where}: debe ser un objeto`);
    const startedOn = month(item['startedOn'], `${where}.startedOn`);
    const finishedOn = item['finishedOn'] === null || item['finishedOn'] === undefined ? null : month(item['finishedOn'], `${where}.finishedOn`);
    if (startedOn && finishedOn && finishedOn < startedOn) errors.push(`${where}: finishedOn es anterior a startedOn`);
    const scene = item['scene'] ?? null;
    if (scene !== null && !isLevelScene(scene)) errors.push(`${where}.scene: debe ser uno de ${LEVEL_SCENES.join(', ')}`);
    return {
      company: text(item['company'], `${where}.company`),
      location: optionalText(item['location'], `${where}.location`),
      startedOn,
      finishedOn,
      title: bilingual(item['title'], `${where}.title`, (v, w) => text(v, w, { max: 200 })),
      description:
        item['description'] === null || item['description'] === undefined
          ? null
          : bilingual(item['description'], `${where}.description`, (v, w) => text(v, w)),
      scene: isLevelScene(scene) ? scene : null,
    };
  }

  if (!isObject(data)) return { ok: false, errors: ['El archivo debe contener un objeto JSON'] };

  const experience = data['experience'];
  if (experience !== undefined && experience !== null && !Array.isArray(experience)) {
    errors.push('experience: debe ser una lista de puestos (o no aparecer)');
  }

  const profile: ProfileFile = {
    name: text(data['name'], 'name', { min: 2, max: 120 }),
    location: optionalText(data['location'], 'location'),
    headline: bilingual(data['headline'], 'headline', (v, w) => text(v, w, { min: 2, max: 220 })),
    summary: bilingual(data['about'], 'about', paragraphs),
    experience: Array.isArray(experience) ? experience.map((item, index) => position(item, `experience[${index}]`)) : null,
  };

  return errors.length ? { ok: false, errors } : { ok: true, profile };
}

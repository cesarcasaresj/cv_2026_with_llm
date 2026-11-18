// Convierte los CSV de la exportación oficial de LinkedIn en el perfil de la portada (spec.md, HU-14 a HU-17).
// Solo lee los campos públicos que muestra la portada: nunca la fecha de nacimiento, la dirección ni el correo.
import { parseCsv } from './csv';

export interface ExportedPosition {
  company: string;
  title: string;
  location: string | null;
  description: string | null;
  startedOn: string; // AAAA-MM
  finishedOn: string | null;
}

export interface ExportedUpdate {
  publishedAt: Date;
  text: string;
  url: string | null;
}

export interface LinkedinProfile {
  fullName: string;
  headline: string;
  location: string | null;
  summary: string;
  positions: ExportedPosition[];
  updates: ExportedUpdate[];
}

export type ExportResult = { ok: true; profile: LinkedinProfile; skippedUpdates: number } | { ok: false; errors: string[] };

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  ene: 1, abr: 4, ago: 8, sept: 9, dic: 12,
};

/** "Nov 2021", "nov. 2021", "2021", "11/2021" o "2021-11" → "2021-11". null si no se entiende. */
export function yearMonth(value: string): string | null {
  const text = value.trim().toLowerCase().replace(/\./g, '');
  const pad = (month: number) => String(month).padStart(2, '0');
  let match: RegExpMatchArray | null;

  if ((match = text.match(/^([a-zñ]+)\s+(?:de\s+)?(\d{4})$/))) {
    // "septiembre" → "sept", "marzo" → "mar", "January" → "jan"
    const month = MONTHS[match[1].slice(0, 4)] ?? MONTHS[match[1].slice(0, 3)];
    return month ? `${match[2]}-${pad(month)}` : null;
  }
  if ((match = text.match(/^(\d{4})$/))) return `${match[1]}-01`;
  if ((match = text.match(/^(\d{1,2})\/(\d{4})$/)) && Number(match[1]) >= 1 && Number(match[1]) <= 12) {
    return `${match[2]}-${pad(Number(match[1]))}`;
  }
  if ((match = text.match(/^(\d{4})-(\d{2})/)) && Number(match[2]) >= 1 && Number(match[2]) <= 12) {
    return `${match[1]}-${match[2]}`;
  }
  return null;
}

/** Fecha de Shares.csv ("2024-01-15 10:22:33", en UTC). */
function shareDate(value: string): Date | null {
  const date = new Date(`${value.trim().replace(' ', 'T')}${/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? '' : 'Z'}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Limpia el texto de una publicación: convierte los hashtags del formato interno ({hashtag|\#|Angular})
 * y quita el par de comillas que a veces envuelve todo el texto. Las comillas dobladas ya las resuelve parseCsv.
 */
export function cleanShareText(value: string): string {
  const text = value.replace(/\{hashtag\|\\?#\|([^}]+)\}/g, '#$1').trim();
  return text.length > 1 && text.startsWith('"') && text.endsWith('"') ? text.slice(1, -1).trim() : text;
}

function pick(row: Record<string, string>, ...names: string[]): string {
  const key = Object.keys(row).find((candidate) => names.some((name) => candidate.toLowerCase() === name.toLowerCase()));
  return key ? row[key].trim() : '';
}

const nullable = (value: string) => (value === '' ? null : value);
const isHttps = (value: string) => /^https:\/\/\S+$/.test(value);

/**
 * @param files contenido de Profile.csv, Positions.csv y Shares.csv (este último es opcional).
 * @param maxUpdates cuántas publicaciones recientes se guardan.
 */
export function readLinkedinExport(
  files: { profile: string; positions: string; shares: string | null },
  maxUpdates: number,
): ExportResult {
  const errors: string[] = [];

  const [profileRow] = parseCsv(files.profile);
  if (!profileRow) return { ok: false, errors: ['Profile.csv está vacío'] };

  const fullName = `${pick(profileRow, 'First Name', 'Nombre')} ${pick(profileRow, 'Last Name', 'Apellidos')}`.trim();
  const headline = pick(profileRow, 'Headline', 'Titular');
  if (fullName.length < 2) errors.push('Profile.csv: falta el nombre (First Name / Last Name)');
  if (headline.length < 2) errors.push('Profile.csv: falta el titular (Headline)');

  const positions: ExportedPosition[] = [];
  parseCsv(files.positions).forEach((row, index) => {
    const line = `Positions.csv, fila ${index + 2}`;
    const company = pick(row, 'Company Name', 'Nombre de la empresa');
    const title = pick(row, 'Title', 'Cargo');
    const startedOn = yearMonth(pick(row, 'Started On', 'Fecha de inicio'));
    const finishedRaw = pick(row, 'Finished On', 'Fecha de finalización');
    const finishedOn = finishedRaw === '' ? null : yearMonth(finishedRaw);

    if (!company || !title) errors.push(`${line}: falta la empresa o el cargo`);
    if (!startedOn) errors.push(`${line}: no se entiende la fecha de inicio`);
    if (finishedRaw !== '' && !finishedOn) errors.push(`${line}: no se entiende la fecha de fin "${finishedRaw}"`);
    if (startedOn && finishedOn && finishedOn < startedOn) errors.push(`${line}: la fecha de fin es anterior a la de inicio`);

    if (company && title && startedOn) {
      positions.push({
        company,
        title,
        location: nullable(pick(row, 'Location', 'Ubicación')),
        description: nullable(pick(row, 'Description', 'Descripción')),
        startedOn,
        finishedOn,
      });
    }
  });

  // Solo publicaciones visibles para cualquiera: las de "solo contactos" no se publican en la web
  let skippedUpdates = 0;
  const updates: ExportedUpdate[] = [];
  for (const row of files.shares ? parseCsv(files.shares) : []) {
    const visibility = pick(row, 'Visibility');
    const text = cleanShareText(pick(row, 'ShareCommentary'));
    const publishedAt = shareDate(pick(row, 'Date'));
    const link = pick(row, 'ShareLink');

    if (/connection/i.test(visibility) || !text || !publishedAt) {
      skippedUpdates++;
      continue;
    }
    updates.push({ publishedAt, text, url: isHttps(link) ? link : null });
  }
  updates.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    skippedUpdates,
    profile: {
      fullName,
      headline,
      location: nullable(pick(profileRow, 'Geo Location', 'Ubicación')),
      summary: pick(profileRow, 'Summary', 'Extracto'),
      positions,
      updates: updates.slice(0, maxUpdates),
    },
  };
}

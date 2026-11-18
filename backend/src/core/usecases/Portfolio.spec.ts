import { describe, expect, it } from 'vitest';
import { GetProfile, ListProjects, ListUpdates, MAX_PROJECTS, paragraphs, parseLang } from './Portfolio';
import { NotFoundError, ValidationError } from '../domain/errors';
import type { Position, Profile, ProfileRepository, ProfileUpdate, Project } from '../domain/Profile';

function position(overrides: Partial<Position>): Position {
  return {
    company: 'Empresa',
    title: 'Puesto',
    location: null,
    startedOn: '2020-01',
    finishedOn: null,
    description: null,
    scene: null,
    ...overrides,
  };
}

function profiles(profile: Profile | null, updates: ProfileUpdate[] = []): ProfileRepository {
  return { getProfile: async () => profile, listUpdates: async (limit) => updates.slice(0, limit) };
}

function project(overrides: Partial<Project>): Project {
  return {
    name: 'repo',
    description: null,
    url: 'https://github.com/autor/repo',
    homepage: null,
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: [],
    pushedAt: new Date('2026-01-01T00:00:00Z'),
    fork: false,
    archived: false,
    ...overrides,
  };
}

describe('paragraphs', () => {
  it('separa por saltos de línea y descarta los vacíos', () => {
    expect(paragraphs('Primero.\r\n\r\nSegundo.\nTercero.\n  ')).toEqual(['Primero.', 'Segundo.', 'Tercero.']);
  });
});

describe('GetProfile', () => {
  it('sin perfil cargado lanza NotFoundError', async () => {
    await expect(new GetProfile(profiles(null)).execute()).rejects.toBeInstanceOf(NotFoundError);
  });

  it('devuelve "Acerca de mí" en párrafos y el puesto actual primero', async () => {
    const result = await new GetProfile(
      profiles({
        lang: 'es',
        name: 'Persona',
        headline: 'Desarrolladora',
        location: null,
        summary: 'Uno.\n\nDos.',
        experience: [
          position({ company: 'Antigua', startedOn: '2015-01', finishedOn: '2018-06' }),
          position({ company: 'Actual', startedOn: '2022-03', finishedOn: null }),
          position({ company: 'Anterior', startedOn: '2018-07', finishedOn: '2022-02' }),
        ],
      }),
    ).execute();

    expect(result.about).toEqual(['Uno.', 'Dos.']);
    expect(result.experience.map((p) => p.company)).toEqual(['Actual', 'Anterior', 'Antigua']);
    expect(result).not.toHaveProperty('summary');
  });
});

describe('GetProfile en otro idioma (HU-18)', () => {
  it('pide al repositorio el idioma indicado y devuelve el que se sirvió', async () => {
    const asked: string[] = [];
    const repository: ProfileRepository = {
      getProfile: async (lang) => {
        asked.push(lang);
        return { lang, name: 'Persona', headline: 'Developer', location: null, summary: 'One.', experience: [] };
      },
      listUpdates: async () => [],
    };

    const result = await new GetProfile(repository).execute('en');

    expect(asked).toEqual(['en']);
    expect(result.lang).toBe('en');
    expect(result.about).toEqual(['One.']);
  });

  it('sin indicar idioma usa el español', async () => {
    const asked: string[] = [];
    const repository: ProfileRepository = {
      getProfile: async (lang) => {
        asked.push(lang);
        return null;
      },
      listUpdates: async () => [],
    };

    await expect(new GetProfile(repository).execute()).rejects.toBeInstanceOf(NotFoundError);
    expect(asked).toEqual(['es']);
  });
});

describe('parseLang', () => {
  it('sin valor devuelve el idioma base', () => {
    expect(parseLang(undefined)).toBe('es');
  });

  it('acepta "es" y "en"', () => {
    expect(parseLang('es')).toBe('es');
    expect(parseLang('en')).toBe('en');
  });

  it.each(['fr', 'EN', '', ['en']])('rechaza %j con ValidationError', (value) => {
    expect(() => parseLang(value)).toThrow(ValidationError);
  });
});

describe('ListProjects', () => {
  it('quita forks y archivados y ordena por última actualización', async () => {
    const source = {
      listPublicProjects: async () => [
        project({ name: 'viejo', pushedAt: new Date('2024-01-01') }),
        project({ name: 'fork', fork: true }),
        project({ name: 'archivado', archived: true }),
        project({ name: 'nuevo', pushedAt: new Date('2026-05-01') }),
      ],
    };

    const result = await new ListProjects(source).execute();

    expect(result.map((p) => p.name)).toEqual(['nuevo', 'viejo']);
  });

  it(`muestra como máximo ${MAX_PROJECTS}`, async () => {
    const many = Array.from({ length: 20 }, (_, i) => project({ name: `r${i}` }));
    const result = await new ListProjects({ listPublicProjects: async () => many }).execute();

    expect(result).toHaveLength(MAX_PROJECTS);
  });
});

describe('ListUpdates', () => {
  it('limita el número de publicaciones', async () => {
    const updates = Array.from({ length: 10 }, (_, i) => ({ publishedAt: new Date(2026, 0, i + 1), text: `t${i}`, url: null }));

    expect(await new ListUpdates(profiles(null, updates)).execute()).toHaveLength(6);
  });
});

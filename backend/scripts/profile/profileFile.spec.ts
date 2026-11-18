import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readProfileFile } from './profileFile';

const valid = {
  name: 'Persona Ejemplo',
  location: null,
  headline: { es: 'Desarrolladora web', en: 'Web developer' },
  about: { es: ['Uno.', 'Dos.'], en: ['One.', 'Two.'] },
};

describe('readProfileFile', () => {
  it('une los párrafos con una línea en blanco y respeta los dos idiomas', () => {
    const result = readProfileFile(valid);

    expect(result).toEqual({
      ok: true,
      profile: {
        name: 'Persona Ejemplo',
        location: null,
        headline: { es: 'Desarrolladora web', en: 'Web developer' },
        summary: { es: 'Uno.\n\nDos.', en: 'One.\n\nTwo.' },
        experience: null,
      },
    });
  });

  it('el inglés es opcional', () => {
    const result = readProfileFile({ ...valid, headline: { es: 'Desarrolladora web' }, about: { es: ['Uno.'] } });

    expect(result.ok && result.profile.headline.en).toBeNull();
    expect(result.ok && result.profile.summary.en).toBeNull();
  });

  it('lee la experiencia con fechas AAAA-MM y textos bilingües', () => {
    const result = readProfileFile({
      ...valid,
      experience: [
        {
          company: 'Empresa',
          location: 'Remoto',
          startedOn: '2021-03',
          finishedOn: null,
          title: { es: 'Desarrolladora', en: 'Developer' },
          description: { es: 'Hago cosas.' },
        },
      ],
    });

    expect(result.ok && result.profile.experience).toEqual([
      {
        company: 'Empresa',
        location: 'Remoto',
        startedOn: '2021-03',
        finishedOn: null,
        title: { es: 'Desarrolladora', en: 'Developer' },
        description: { es: 'Hago cosas.', en: null },
        scene: null,
      },
    ]);
  });

  it('junta todos los errores para corregirlos de una vez', () => {
    const result = readProfileFile({
      name: 'X',
      headline: 'sin idiomas',
      about: { es: [] },
      experience: [{ company: 'Empresa', startedOn: 'marzo 2021', finishedOn: '2020-01', title: { es: 'Puesto' } }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('name'),
        expect.stringContaining('headline'),
        expect.stringContaining('about.es'),
        expect.stringContaining('experience[0].startedOn'),
      ]),
    );
  });

  it('acepta un diorama conocido y rechaza uno que no existe', () => {
    const position = { company: 'Empresa', startedOn: '2022-01', title: { es: 'Puesto' } };
    const ok = readProfileFile({ ...valid, experience: [{ ...position, scene: 'antenna' }] });
    const ko = readProfileFile({ ...valid, experience: [{ ...position, scene: 'castillo' }] });

    expect(ok.ok && ok.profile.experience?.[0].scene).toBe('antenna');
    expect(ko.ok).toBe(false);
  });

  it('rechaza una fecha de fin anterior a la de inicio', () => {
    const result = readProfileFile({
      ...valid,
      experience: [{ company: 'Empresa', startedOn: '2022-01', finishedOn: '2021-12', title: { es: 'Puesto' } }],
    });

    expect(result).toEqual({ ok: false, errors: ['experience[0]: finishedOn es anterior a startedOn'] });
  });

  it('el perfil del repositorio (content/perfil/perfil.json) es válido', () => {
    const file = JSON.parse(readFileSync(join(__dirname, '../../../content/perfil/perfil.json'), 'utf8'));

    expect(readProfileFile(file).ok).toBe(true);
  });
});

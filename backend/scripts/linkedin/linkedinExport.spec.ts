import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';
import { cleanShareText, readLinkedinExport, yearMonth } from './linkedinExport';

const PROFILE = `﻿First Name,Last Name,Maiden Name,Address,Birth Date,Headline,Summary,Industry,Zip Code,Geo Location
Ana,Pérez,,Calle Privada 1,"Jan 1, 1990",Arquitecta de software,"Primer párrafo.
Segundo párrafo, con ""comillas"".",Software,00000,"Madrid, España"`;

const POSITIONS = `Company Name,Title,Description,Location,Started On,Finished On
Actual S.A.,Tech Lead,"Lidero el equipo.",Remoto,Mar 2023,
Anterior S.L.,Desarrolladora,,Madrid,Jan 2019,Feb 2023`;

const SHARES = `Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility
2026-10-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:1,"Publiqué mi CV {hashtag|\\#|Angular}",,,MEMBER_NETWORK
2026-11-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:2,"Más reciente",,,MEMBER_NETWORK
2026-09-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:3,"Solo para contactos",,,CONNECTIONS_ONLY
2026-08-01 09:00:00,,,,,MEMBER_NETWORK`;

describe('parseCsv', () => {
  it('admite comillas, comillas dobladas, comas y saltos de línea dentro de un campo', () => {
    const [row] = parseCsv('a,b\r\n"uno, dos","línea 1\nlínea ""2"""\r\n');

    expect(row).toEqual({ a: 'uno, dos', b: 'línea 1\nlínea "2"' });
  });

  it('ignora el BOM y las líneas vacías', () => {
    expect(parseCsv('﻿x\n1\n\n')).toEqual([{ x: '1' }]);
  });
});

describe('yearMonth', () => {
  it.each([
    ['Nov 2021', '2021-11'],
    ['nov. 2021', '2021-11'],
    ['septiembre de 2020', '2020-09'],
    ['January 2018', '2018-01'],
    ['2019', '2019-01'],
    ['3/2022', '2022-03'],
    ['2024-07', '2024-07'],
  ])('"%s" → %s', (input, expected) => {
    expect(yearMonth(input)).toBe(expected);
  });

  it.each(['', 'Foo 2020', '13/2020', 'ayer'])('"%s" → null', (input) => {
    expect(yearMonth(input)).toBeNull();
  });
});

describe('cleanShareText', () => {
  it('convierte los hashtags internos y quita el par de comillas que envuelve el texto', () => {
    expect(cleanShareText('"Hola {hashtag|\\#|OpenAPI} y "citas""')).toBe('Hola #OpenAPI y "citas"');
  });

  it('conserva las comillas que no envuelven todo el texto', () => {
    expect(cleanShareText('Dije "hola" y me fui')).toBe('Dije "hola" y me fui');
  });
});

describe('readLinkedinExport', () => {
  it('lee solo los campos públicos del perfil', () => {
    const result = readLinkedinExport({ profile: PROFILE, positions: POSITIONS, shares: SHARES }, 6);
    if (!result.ok) throw new Error(result.errors.join('\n'));

    expect(result.profile).toMatchObject({
      fullName: 'Ana Pérez',
      headline: 'Arquitecta de software',
      location: 'Madrid, España',
      summary: 'Primer párrafo.\nSegundo párrafo, con "comillas".',
    });
    expect(JSON.stringify(result.profile)).not.toContain('Calle Privada');
    expect(JSON.stringify(result.profile)).not.toContain('1990');
  });

  it('convierte la experiencia, con el puesto actual sin fecha de fin', () => {
    const result = readLinkedinExport({ profile: PROFILE, positions: POSITIONS, shares: null }, 6);
    if (!result.ok) throw new Error(result.errors.join('\n'));

    expect(result.profile.positions).toEqual([
      { company: 'Actual S.A.', title: 'Tech Lead', location: 'Remoto', description: 'Lidero el equipo.', startedOn: '2023-03', finishedOn: null },
      { company: 'Anterior S.L.', title: 'Desarrolladora', location: 'Madrid', description: null, startedOn: '2019-01', finishedOn: '2023-02' },
    ]);
  });

  it('publica solo lo visible para cualquiera, de lo más reciente a lo más antiguo', () => {
    const result = readLinkedinExport({ profile: PROFILE, positions: POSITIONS, shares: SHARES }, 6);
    if (!result.ok) throw new Error(result.errors.join('\n'));

    expect(result.profile.updates.map((u) => u.text)).toEqual(['Más reciente', 'Publiqué mi CV #Angular']);
    expect(result.skippedUpdates).toBe(2);
  });

  it('respeta el máximo de publicaciones', () => {
    const result = readLinkedinExport({ profile: PROFILE, positions: POSITIONS, shares: SHARES }, 1);
    if (!result.ok) throw new Error(result.errors.join('\n'));

    expect(result.profile.updates).toHaveLength(1);
  });

  it('lista los errores y no devuelve nada si hay datos incompletos', () => {
    const result = readLinkedinExport(
      {
        profile: 'First Name,Last Name,Headline\nAna,,',
        positions: 'Company Name,Title,Started On,Finished On\nX,,ayer,2020\nY,Dev,Jan 2022,Jan 2021',
        shares: null,
      },
      6,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      'Profile.csv: falta el titular (Headline)',
      'Positions.csv, fila 2: falta la empresa o el cargo',
      'Positions.csv, fila 2: no se entiende la fecha de inicio',
      'Positions.csv, fila 3: la fecha de fin es anterior a la de inicio',
    ]);
  });
});

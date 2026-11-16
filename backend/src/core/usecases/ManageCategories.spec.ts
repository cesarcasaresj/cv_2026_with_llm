import { describe, expect, it } from 'vitest';
import { CreateCategory, DeleteCategory, ListManagedCategories, RenameCategory } from './ManageCategories';
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors';
import { fakeCatalog } from './testing/fakes';

const seguridad = { id: 1, name: 'Seguridad', slug: 'seguridad', postCount: 2 };
const vacia = { id: 2, name: 'Arquitectura', slug: 'arquitectura', postCount: 0 };

describe('ListManagedCategories', () => {
  it('incluye las categorías vacías, ordenadas por nombre', async () => {
    const result = await new ListManagedCategories(fakeCatalog([seguridad, vacia])).execute();

    expect(result.map((category) => category.name)).toEqual(['Arquitectura', 'Seguridad']);
  });
});

describe('CreateCategory', () => {
  it('guarda el nombre sin espacios sobrantes y calcula el slug', async () => {
    const created = await new CreateCategory(fakeCatalog([])).execute('  Diseño   accesible ');

    expect(created).toMatchObject({ name: 'Diseño accesible', slug: 'diseno-accesible', postCount: 0 });
  });

  it.each([undefined, '', ' a ', 'x'.repeat(41), 42])('rechaza el nombre %j con ValidationError', async (name) => {
    await expect(new CreateCategory(fakeCatalog([])).execute(name)).rejects.toBeInstanceOf(ValidationError);
  });

  it('rechaza un nombre sin letras ni números (no tendría slug)', async () => {
    await expect(new CreateCategory(fakeCatalog([])).execute('¿¿??')).rejects.toBeInstanceOf(ValidationError);
  });

  it('un nombre repetido sin distinguir mayúsculas responde ConflictError', async () => {
    const catalog = fakeCatalog([seguridad]);

    await expect(new CreateCategory(catalog).execute('SEGURIDAD')).rejects.toBeInstanceOf(ConflictError);
    expect(catalog.items).toHaveLength(1);
  });

  it('un nombre que produce el mismo slug responde ConflictError', async () => {
    const catalog = fakeCatalog([{ id: 3, name: 'Diseño', slug: 'diseno', postCount: 0 }]);

    await expect(new CreateCategory(catalog).execute('Diseno')).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('RenameCategory', () => {
  it('cambia nombre y slug, y conserva sus artículos', async () => {
    const catalog = fakeCatalog([seguridad]);

    const renamed = await new RenameCategory(catalog).execute(1, 'Seguridad web');

    expect(renamed).toMatchObject({ id: 1, name: 'Seguridad web', slug: 'seguridad-web', postCount: 2 });
  });

  it('permite cambiar solo mayúsculas del propio nombre', async () => {
    const renamed = await new RenameCategory(fakeCatalog([seguridad])).execute(1, 'SEGURIDAD');

    expect(renamed.name).toBe('SEGURIDAD');
  });

  it('no permite tomar el nombre de otra categoría', async () => {
    const useCase = new RenameCategory(fakeCatalog([seguridad, vacia]));

    await expect(useCase.execute(2, 'seguridad')).rejects.toBeInstanceOf(ConflictError);
  });

  it('con un id inexistente lanza NotFoundError', async () => {
    await expect(new RenameCategory(fakeCatalog([])).execute(9, 'Nueva')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('DeleteCategory', () => {
  it('borra una categoría sin artículos', async () => {
    const catalog = fakeCatalog([seguridad, vacia]);

    await new DeleteCategory(catalog).execute(2);

    expect(catalog.items.map((category) => category.id)).toEqual([1]);
  });

  it('no borra una categoría con artículos (ConflictError)', async () => {
    const catalog = fakeCatalog([seguridad]);

    await expect(new DeleteCategory(catalog).execute(1)).rejects.toBeInstanceOf(ConflictError);
    expect(catalog.items).toHaveLength(1);
  });

  it('con un id inexistente lanza NotFoundError', async () => {
    await expect(new DeleteCategory(fakeCatalog([])).execute(9)).rejects.toBeInstanceOf(NotFoundError);
  });
});

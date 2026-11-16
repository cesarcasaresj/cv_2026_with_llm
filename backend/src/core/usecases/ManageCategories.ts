// Gestión de la lista fija de categorías por el autor (spec.md, HU-09).
import { categoryName, type CategoryCatalog, type ManagedCategory } from '../domain/Taxonomy';
import { ConflictError, NotFoundError } from '../domain/errors';

const NOT_FOUND = 'No encontramos esa categoría.';

async function assertNameIsFree(catalog: CategoryCatalog, name: string, slug: string, exceptId?: number) {
  const other = await catalog.findConflict(name, slug, exceptId);
  if (other) throw new ConflictError(`Ya existe la categoría "${other.name}".`);
}

export class ListManagedCategories {
  constructor(private readonly catalog: CategoryCatalog) {}

  execute(): Promise<ManagedCategory[]> {
    return this.catalog.listAll();
  }
}

export class CreateCategory {
  constructor(private readonly catalog: CategoryCatalog) {}

  async execute(rawName: unknown): Promise<ManagedCategory> {
    const { name, slug } = categoryName(rawName);
    await assertNameIsFree(this.catalog, name, slug);
    return this.catalog.create(name, slug);
  }
}

/** Renombrar no toca las asignaciones: los artículos siguen apuntando al mismo id. */
export class RenameCategory {
  constructor(private readonly catalog: CategoryCatalog) {}

  async execute(id: number, rawName: unknown): Promise<ManagedCategory> {
    const { name, slug } = categoryName(rawName);
    if (!(await this.catalog.findById(id))) throw new NotFoundError(NOT_FOUND);

    await assertNameIsFree(this.catalog, name, slug, id);
    const renamed = await this.catalog.rename(id, name, slug);
    if (!renamed) throw new NotFoundError(NOT_FOUND);
    return renamed;
  }
}

/** Una categoría con artículos no se borra: primero hay que reasignarlos (decisión C). */
export class DeleteCategory {
  constructor(private readonly catalog: CategoryCatalog) {}

  async execute(id: number): Promise<void> {
    const result = await this.catalog.delete(id);
    if (result === 'not-found') throw new NotFoundError(NOT_FOUND);
    if (result === 'in-use') {
      throw new ConflictError('Esta categoría tiene artículos. Asígnales otra categoría antes de borrarla.');
    }
  }
}

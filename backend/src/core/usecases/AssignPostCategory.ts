// Categoría de cada artículo, vista y asignada por el autor (spec.md, HU-08).
import type { AuthorPost, AuthorPostRepository } from '../domain/Post';
import type { CategoryCatalog } from '../domain/Taxonomy';
import { NotFoundError, ValidationError } from '../domain/errors';

export class ListAuthorPosts {
  constructor(private readonly posts: AuthorPostRepository) {}

  execute(): Promise<AuthorPost[]> {
    return this.posts.listAll();
  }
}

/** Un artículo tiene exactamente una categoría: asignar una nueva reemplaza la anterior. */
export class AssignPostCategory {
  constructor(
    private readonly catalog: CategoryCatalog,
    private readonly posts: AuthorPostRepository,
  ) {}

  async execute(postId: number, categoryId: unknown): Promise<AuthorPost> {
    // Sin categoría el artículo no es válido (decisión B): 422, igual que una categoría inexistente
    if (typeof categoryId !== 'number' || !Number.isInteger(categoryId) || categoryId < 1) {
      throw new ValidationError('Elige una categoría.');
    }
    if (!(await this.catalog.findById(categoryId))) {
      throw new ValidationError('Esa categoría no existe. Elige una de la lista.');
    }

    const updated = await this.posts.assignCategory(postId, categoryId);
    if (!updated) throw new NotFoundError('No encontramos ese artículo.');
    return updated;
  }
}

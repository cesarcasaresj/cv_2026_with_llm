import { Router } from 'express';
import type { GetCurrentUser } from '../../core/usecases/GetCurrentUser';
import type {
  CreateCategory,
  DeleteCategory,
  ListManagedCategories,
  RenameCategory,
} from '../../core/usecases/ManageCategories';
import type { AssignPostCategory, ListAuthorPosts } from '../../core/usecases/AssignPostCategory';
import { NotFoundError } from '../../core/domain/errors';
import type { components } from '../../generated/api';
import { requireSession } from './requireSession';

type ManagedCategoryResponse = components['schemas']['ManagedCategory'];
type AuthorPostResponse = components['schemas']['AuthorPost'];

export interface AuthorUseCases {
  getCurrentUser: GetCurrentUser;
  listCategories: ListManagedCategories;
  createCategory: CreateCategory;
  renameCategory: RenameCategory;
  deleteCategory: DeleteCategory;
  listPosts: ListAuthorPosts;
  assignCategory: AssignPostCategory;
}

/** Un id que no es entero positivo no puede existir: se trata como "no encontrado". */
function resourceId(raw: string, message: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new NotFoundError(message);
  return id;
}

function body(request: { body?: unknown }): Record<string, unknown> {
  return typeof request.body === 'object' && request.body !== null ? (request.body as Record<string, unknown>) : {};
}

/** Rutas del autor (spec.md, HU-08 y HU-09). Todas exigen sesión. */
export function authorRoutes(useCases: AuthorUseCases): Router {
  const router = Router();
  router.use(requireSession(useCases.getCurrentUser));

  router.get('/categories', async (_request, response) => {
    const categories: ManagedCategoryResponse[] = await useCases.listCategories.execute();
    response.json(categories);
  });

  router.post('/categories', async (request, response) => {
    const created: ManagedCategoryResponse = await useCases.createCategory.execute(body(request).name);
    response.status(201).json(created);
  });

  router.patch('/categories/:id', async (request, response) => {
    const id = resourceId(request.params.id, 'No encontramos esa categoría.');
    const renamed: ManagedCategoryResponse = await useCases.renameCategory.execute(id, body(request).name);
    response.json(renamed);
  });

  router.delete('/categories/:id', async (request, response) => {
    await useCases.deleteCategory.execute(resourceId(request.params.id, 'No encontramos esa categoría.'));
    response.status(204).end();
  });

  router.get('/posts', async (_request, response) => {
    const posts: AuthorPostResponse[] = await useCases.listPosts.execute();
    response.json(posts);
  });

  router.put('/posts/:id/category', async (request, response) => {
    const id = resourceId(request.params.id, 'No encontramos ese artículo.');
    const updated: AuthorPostResponse = await useCases.assignCategory.execute(id, body(request).categoryId);
    response.json(updated);
  });

  return router;
}

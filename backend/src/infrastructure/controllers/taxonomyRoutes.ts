import { Router } from 'express';
import type { ListTaxonomyTerms } from '../../core/usecases/ListTaxonomyTerms';
import type { GetCategoryWithPosts } from '../../core/usecases/GetCategoryWithPosts';
import { NotFoundError } from '../../core/domain/errors';
import type { components } from '../../generated/api';
import type { PostPresenter } from './postPresenter';

type TaxonomySummaryResponse = components['schemas']['TaxonomySummary'];
type CategoryDetailResponse = components['schemas']['CategoryDetail'];

export function categoryRoutes(
  listCategories: ListTaxonomyTerms,
  getCategory: GetCategoryWithPosts,
  presenter: PostPresenter,
): Router {
  const router = Router();

  router.get('/', async (_request, response) => {
    const body: TaxonomySummaryResponse[] = await listCategories.execute();
    response.json(body);
  });

  router.get('/:id', async (request, response) => {
    const id = Number(request.params.id);
    // Un id que no es entero positivo no puede existir: se trata como "no encontrado"
    if (!Number.isInteger(id) || id < 1) {
      throw new NotFoundError('No encontramos esa categoría.');
    }

    const category = await getCategory.execute(id);
    const body: CategoryDetailResponse = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      posts: category.posts.map((post) => presenter.summary(post)),
    };
    response.json(body);
  });

  return router;
}

export function tagRoutes(listTags: ListTaxonomyTerms): Router {
  const router = Router();

  router.get('/', async (_request, response) => {
    const body: TaxonomySummaryResponse[] = await listTags.execute();
    response.json(body);
  });

  return router;
}

import { Router } from 'express';
import type { GetTotalPostsCount } from '../../core/usecases/GetTotalPostsCount';
import type { ListPosts } from '../../core/usecases/ListPosts';
import type { GetArticle } from '../../core/usecases/GetArticle';
import { NotFoundError } from '../../core/domain/errors';
import type { components } from '../../generated/api';
import type { PostPresenter } from './postPresenter';

type PostCountResponse = components['schemas']['PostCountResponse'];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Express puede entregar un parámetro repetido como lista; solo se acepta un valor de texto. */
function singleQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function postRoutes(
  getTotalPostsCount: GetTotalPostsCount,
  listPosts: ListPosts,
  getArticle: GetArticle,
  presenter: PostPresenter,
): Router {
  const router = Router();

  router.get('/count', async (_request, response) => {
    const result = await getTotalPostsCount.execute();
    const body: PostCountResponse = {
      total: result.total,
      lastUpdated: result.lastUpdated?.toISOString() ?? null,
    };
    response.json(body);
  });

  router.get('/', async (request, response) => {
    const posts = await listPosts.execute({
      categorySlug: singleQueryValue(request.query.category),
      tagSlug: singleQueryValue(request.query.tag),
    });
    response.json(posts.map((post) => presenter.summary(post)));
  });

  router.get('/:slug', async (request, response) => {
    // Un slug con formato inválido no puede existir: se trata como "no encontrado"
    if (!SLUG_PATTERN.test(request.params.slug)) {
      throw new NotFoundError('No encontramos este artículo.');
    }

    const article = await getArticle.execute(request.params.slug);
    response.json(presenter.article(article));
  });

  return router;
}

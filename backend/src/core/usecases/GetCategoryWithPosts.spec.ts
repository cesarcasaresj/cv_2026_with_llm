import { describe, expect, it } from 'vitest';
import { GetCategoryWithPosts } from './GetCategoryWithPosts';
import { NotFoundError } from '../domain/errors';
import { diseno, fakePosts, fakeTaxonomy, samplePost } from './testing/fakes';

const post = samplePost({ category: diseno });

describe('GetCategoryWithPosts', () => {
  it('devuelve la categoría con sus artículos', async () => {
    const result = await new GetCategoryWithPosts(fakeTaxonomy([diseno]), fakePosts([post])).execute(diseno.id);

    expect(result.name).toBe('Diseño');
    expect(result.posts).toEqual([post]);
  });

  it('con un id inexistente lanza NotFoundError', async () => {
    const useCase = new GetCategoryWithPosts(fakeTaxonomy([diseno]), fakePosts([post]));

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(NotFoundError);
  });
});

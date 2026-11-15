import { describe, expect, it } from 'vitest';
import { GetTotalPostsCount } from './GetTotalPostsCount';
import { fakePosts, samplePost } from './testing/fakes';

describe('GetTotalPostsCount', () => {
  it('devuelve el total que entrega el repositorio', async () => {
    const posts = fakePosts([samplePost({ id: 1 }), samplePost({ id: 2 }), samplePost({ id: 3 })]);

    const result = await new GetTotalPostsCount(posts).execute();

    expect(result.total).toBe(3);
  });
});

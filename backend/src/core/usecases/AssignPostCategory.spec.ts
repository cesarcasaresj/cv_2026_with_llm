import { describe, expect, it } from 'vitest';
import { AssignPostCategory, ListAuthorPosts } from './AssignPostCategory';
import { NotFoundError, ValidationError } from '../domain/errors';
import { fakeAuthorPosts, fakeCatalog } from './testing/fakes';
import type { AuthorPost } from '../domain/Post';

const sinClasificar = { id: 1, name: 'Sin clasificar', slug: 'sin-clasificar', postCount: 1 };
const seguridad = { id: 2, name: 'Seguridad', slug: 'seguridad', postCount: 0 };

const borrador: AuthorPost = {
  id: 10,
  slug: 'borrador-1',
  title: 'Un borrador',
  status: 'draft',
  category: { id: 1, name: 'Sin clasificar', slug: 'sin-clasificar' },
};

function setup() {
  const catalog = fakeCatalog([sinClasificar, seguridad]);
  const posts = fakeAuthorPosts([borrador], catalog);
  return { posts, useCase: new AssignPostCategory(catalog, posts) };
}

describe('ListAuthorPosts', () => {
  it('incluye los borradores', async () => {
    const { posts } = setup();

    expect(await new ListAuthorPosts(posts).execute()).toEqual([borrador]);
  });
});

describe('AssignPostCategory', () => {
  it('reemplaza la categoría anterior por la nueva', async () => {
    const { useCase, posts } = setup();

    const updated = await useCase.execute(10, 2);

    expect(updated.category).toEqual({ id: 2, name: 'Seguridad', slug: 'seguridad' });
    expect((await posts.listAll())[0].category.id).toBe(2);
  });

  it.each([undefined, null, '', '2', 0, 1.5])('categoryId %j responde ValidationError', async (categoryId) => {
    await expect(setup().useCase.execute(10, categoryId)).rejects.toBeInstanceOf(ValidationError);
  });

  it('una categoría inexistente responde ValidationError y no cambia nada', async () => {
    const { useCase, posts } = setup();

    await expect(useCase.execute(10, 99)).rejects.toBeInstanceOf(ValidationError);
    expect((await posts.listAll())[0].category.id).toBe(1);
  });

  it('un artículo inexistente responde NotFoundError', async () => {
    await expect(setup().useCase.execute(99, 2)).rejects.toBeInstanceOf(NotFoundError);
  });
});

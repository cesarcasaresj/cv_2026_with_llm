import type { PostFilter, PostRepository, PostSummary } from '../domain/Post';
import type { TaxonomyRepository } from '../domain/Taxonomy';
import { NotFoundError } from '../domain/errors';

export interface ListPostsInput {
  categorySlug?: string;
  tagSlug?: string;
}

export class ListPosts {
  constructor(
    private readonly categories: TaxonomyRepository,
    private readonly tags: TaxonomyRepository,
    private readonly posts: PostRepository,
  ) {}

  /** Sin filtros devuelve todos los artículos publicados; los filtros se combinan (spec.md, HU-07 y HU-11). */
  async execute(input: ListPostsInput = {}): Promise<PostSummary[]> {
    const filter: PostFilter = {};

    if (input.categorySlug !== undefined) {
      const category = await this.categories.findBySlug(input.categorySlug);
      if (!category) throw new NotFoundError('No encontramos esa categoría.');
      filter.categoryId = category.id;
    }

    if (input.tagSlug !== undefined) {
      const tag = await this.tags.findBySlug(input.tagSlug);
      if (!tag) throw new NotFoundError('No encontramos esa etiqueta.');
      filter.tagId = tag.id;
    }

    return this.posts.listPosts(filter);
  }
}

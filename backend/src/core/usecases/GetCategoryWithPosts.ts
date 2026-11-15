import type { PostRepository, PostSummary } from '../domain/Post';
import type { TaxonomyRef, TaxonomyRepository } from '../domain/Taxonomy';
import { NotFoundError } from '../domain/errors';

export interface CategoryWithPosts extends TaxonomyRef {
  posts: PostSummary[];
}

export class GetCategoryWithPosts {
  constructor(
    private readonly categories: TaxonomyRepository,
    private readonly posts: PostRepository,
  ) {}

  async execute(categoryId: number): Promise<CategoryWithPosts> {
    const category = await this.categories.findById(categoryId);
    if (!category) {
      throw new NotFoundError('No encontramos esa categoría.');
    }

    const posts = await this.posts.listPosts({ categoryId: category.id });
    return { ...category, posts };
  }
}

import type { PostCount, PostRepository } from '../domain/Post';

export class GetTotalPostsCount {
  constructor(private readonly posts: PostRepository) {}

  execute(): Promise<PostCount> {
    return this.posts.getTotalPostsCount();
  }
}

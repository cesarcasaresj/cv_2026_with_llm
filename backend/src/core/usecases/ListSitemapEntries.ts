import type { PostRepository, SitemapEntry } from '../domain/Post';

/** Artículos publicados que deben aparecer en sitemap.xml (spec.md, HU-12). */
export class ListSitemapEntries {
  constructor(private readonly posts: PostRepository) {}

  execute(): Promise<SitemapEntry[]> {
    return this.posts.listSitemapEntries();
  }
}

import type { CoverImage, PostSummary } from '../../core/domain/Post';
import type { ArticleView } from '../../core/usecases/GetArticle';
import type { components } from '../../generated/api';

type PostSummaryResponse = components['schemas']['PostSummary'];
type ArticleDetailResponse = components['schemas']['ArticleDetail'];
type CoverImageResponse = components['schemas']['CoverImage'];

/**
 * Traduce artículos del dominio al formato del contrato.
 * `imageBaseUrl` es la URL base de las imágenes (spec.md, decisión H): cambiarla a un CDN no toca nada más.
 */
export class PostPresenter {
  constructor(private readonly imageBaseUrl: string) {}

  summary(post: PostSummary): PostSummaryResponse {
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      publishedAt: post.publishedAt.toISOString(),
      category: post.category,
      tags: post.tags,
      cover: post.cover ? this.cover(post.cover) : null,
    };
  }

  article(article: ArticleView): ArticleDetailResponse {
    return {
      ...this.summary(article),
      seoTitle: article.seoTitle,
      updatedAt: article.updatedAt.toISOString(),
      readingMinutes: article.readingMinutes,
      bodyHtml: article.bodyHtml,
      author: { name: article.authorName },
    };
  }

  private cover(cover: CoverImage): CoverImageResponse {
    const base = `${this.imageBaseUrl}/${cover.path}`;
    return {
      avif: `${base}.avif`,
      webp: `${base}.webp`,
      fallback: `${base}.jpg`,
      alt: cover.decorative ? '' : cover.alt,
      decorative: cover.decorative,
      width: cover.width,
      height: cover.height,
    };
  }
}

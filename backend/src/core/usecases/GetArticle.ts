import type { Article, MarkdownRenderer, PostRepository } from '../domain/Post';
import { NotFoundError } from '../domain/errors';

/** Ritmo de lectura usado para el tiempo estimado (spec.md, HU-10). */
const WORDS_PER_MINUTE = 200;

export interface ArticleView extends Omit<Article, 'bodyMarkdown'> {
  bodyHtml: string;
  readingMinutes: number;
}

/** Minutos de lectura: palabras del cuerpo entre 200, redondeado hacia arriba y como mínimo 1. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter((word) => word.length > 0).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export class GetArticle {
  constructor(
    private readonly posts: PostRepository,
    private readonly markdown: MarkdownRenderer,
  ) {}

  async execute(slug: string): Promise<ArticleView> {
    // Un borrador se trata igual que un artículo inexistente: el visitante no debe saber que existe
    const article = await this.posts.findPublishedBySlug(slug);
    if (!article) {
      throw new NotFoundError('No encontramos este artículo.');
    }

    const { bodyMarkdown, ...rest } = article;
    return {
      ...rest,
      bodyHtml: this.markdown.render(bodyMarkdown),
      readingMinutes: readingMinutes(bodyMarkdown),
    };
  }
}

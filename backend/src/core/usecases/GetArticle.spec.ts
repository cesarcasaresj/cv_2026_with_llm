import { describe, expect, it } from 'vitest';
import { GetArticle, readingMinutes } from './GetArticle';
import { NotFoundError } from '../domain/errors';
import type { MarkdownRenderer } from '../domain/Post';
import { fakePosts, sampleArticle } from './testing/fakes';

// Conversor falso: deja ver que el caso de uso usa el puerto, sin depender de marked
const markdown: MarkdownRenderer = { render: (source) => `<html>${source}</html>` };

describe('GetArticle', () => {
  it('devuelve el artículo con el cuerpo convertido y sin el Markdown original', async () => {
    const article = sampleArticle({ slug: 'mi-articulo', bodyMarkdown: 'Hola' });

    const result = await new GetArticle(fakePosts([], [article]), markdown).execute('mi-articulo');

    expect(result.bodyHtml).toBe('<html>Hola</html>');
    expect(result).not.toHaveProperty('bodyMarkdown');
    expect(result.authorName).toBe('Autor de prueba');
  });

  it('con un slug inexistente o de un borrador lanza NotFoundError', async () => {
    const useCase = new GetArticle(fakePosts([], []), markdown);

    await expect(useCase.execute('borrador')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('readingMinutes', () => {
  it('redondea hacia arriba a 200 palabras por minuto', () => {
    expect(readingMinutes('palabra '.repeat(201))).toBe(2);
  });

  it('nunca devuelve menos de 1 minuto', () => {
    expect(readingMinutes('')).toBe(1);
  });
});

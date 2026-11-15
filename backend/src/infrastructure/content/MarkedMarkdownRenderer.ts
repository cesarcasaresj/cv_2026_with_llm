import { Marked } from 'marked';
import type { MarkdownRenderer } from '../../core/domain/Post';

/**
 * Convierte el cuerpo de un artículo de Markdown a HTML (spec.md, decisión D).
 * Baja un nivel cada encabezado: el título del artículo es el único <h1> de la página,
 * así que `#` en el Markdown pasa a ser <h2> (HU-13).
 * El HTML resultante lo sanea Angular al pintarlo con [innerHTML].
 */
export class MarkedMarkdownRenderer implements MarkdownRenderer {
  private readonly marked = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'heading') {
        token.depth = Math.min(token.depth + 1, 6);
      }
    },
  });

  render(markdown: string): string {
    return this.marked.parse(markdown, { async: false });
  }
}

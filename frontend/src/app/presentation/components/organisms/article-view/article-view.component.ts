import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { components } from '../../../../core/api/generated';

export type ArticleDetail = components['schemas']['ArticleDetail'];
export type ArticleState = 'loading' | 'error' | 'not-found' | 'ready';

/**
 * Artículo completo (spec.md, HU-10 y HU-13). Solo presenta: la página decide el estado y el SEO.
 * El cuerpo llega como HTML desde el backend y Angular lo sanea al pintarlo con [innerHTML].
 */
@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-article-view',
  templateUrl: './article-view.component.html',
  styleUrl: './article-view.component.css',
})
export class ArticleViewComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly lang = this.i18n.lang;
  readonly article = input<ArticleDetail | null>(null);
  readonly state = input.required<ArticleState>();

  /** Solo se muestra "Actualizado el…" si la fecha cambió respecto a la de publicación. */
  protected readonly wasUpdated = computed(() => {
    const article = this.article();
    return !!article && article.updatedAt.slice(0, 10) !== article.publishedAt.slice(0, 10);
  });
}

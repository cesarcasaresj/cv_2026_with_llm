import { Component, RESPONSE_INIT, computed, effect, inject, input } from '@angular/core';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { SeoService } from '../../../core/seo/seo.service';
import {
  ArticleViewComponent,
  type ArticleDetail,
  type ArticleState,
} from '../../components/organisms/article-view/article-view.component';

@Component({
  imports: [ArticleViewComponent],
  selector: 'app-article-page',
  template: `<app-article-view [state]="state()" [article]="loadedArticle()" />`,
})
export class ArticlePageComponent {
  private readonly seo = inject(SeoService);
  private readonly announcer = inject(LiveAnnouncer);
  /** Solo existe durante el render en el servidor: permite responder 404 a buscadores. */
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });

  /** Parámetro :slug de la ruta (withComponentInputBinding). */
  readonly slug = input.required<string>();

  protected readonly article = httpResource<ArticleDetail>(() => `/api/v1/posts/${encodeURIComponent(this.slug())}`);

  /** value() lanza una excepción si el recurso falló: solo se lee cuando hay valor. */
  protected readonly loadedArticle = computed(() => (this.article.hasValue() ? this.article.value() : null));

  protected readonly state = computed<ArticleState>(() => {
    if (this.article.isLoading()) return 'loading';
    const error = this.article.error();
    if (error) return error instanceof HttpErrorResponse && error.status === 404 ? 'not-found' : 'error';
    return this.loadedArticle() ? 'ready' : 'loading';
  });

  constructor() {
    effect(() => {
      const state = this.state();
      const article = this.loadedArticle();

      if (state === 'ready' && article) {
        this.seo.setArticle(article);
      } else if (state === 'not-found') {
        this.seo.setPage({
          title: 'Artículo no encontrado',
          description: 'El artículo que buscas no existe o ya no está disponible.',
          path: `/articulos/${this.slug()}`,
          noindex: true,
        });
        // Un 404 real evita que los buscadores indexen una página "no encontrado" como si fuera contenido
        if (this.responseInit) this.responseInit.status = 404;
        this.announcer.announce('No encontramos este artículo', 'polite');
      } else if (state === 'error') {
        if (this.responseInit) this.responseInit.status = 503;
        this.announcer.announce('No pudimos cargar el artículo', 'polite');
      } else if (state === 'loading') {
        this.announcer.announce('Cargando el artículo', 'polite');
      }
    });
  }
}

import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { components } from '../../../../core/api/generated';
import { I18nService } from '../../../../core/i18n/i18n.service';

type PostSummary = components['schemas']['PostSummary'];

/** Lista de artículos publicados, con filtros opcionales de categoría y etiqueta (spec.md, HU-07 y HU-11). */
@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.css',
})
export class PostListComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly lang = this.i18n.lang;
  private readonly announcer = inject(LiveAnnouncer);

  /** Slug de la categoría, o null para no filtrar. */
  readonly category = input<string | null>(null);
  /** Slug de la etiqueta, o null para no filtrar. */
  readonly tag = input<string | null>(null);

  protected readonly posts = httpResource<PostSummary[]>(() => {
    const params = new URLSearchParams();
    if (this.category()) params.set('category', this.category()!);
    if (this.tag()) params.set('tag', this.tag()!);
    const query = params.toString();
    return query ? `/api/v1/posts?${query}` : '/api/v1/posts';
  });

  /** Si el filtro de la URL ya no existe (404) se dice así; para el resto de errores, un mensaje genérico. */
  protected readonly errorMessage = computed(() => {
    const error = this.posts.error();
    const text = this.t().postList;
    return error instanceof HttpErrorResponse && error.status === 404 ? text.filterNotFound : text.error;
  });

  constructor() {
    // Al cambiar de filtro se anuncia cuántos artículos hay (HU-07). Cambiar de idioma no repite el anuncio.
    effect(() => {
      const text = untracked(this.t).postList;
      if (this.posts.isLoading()) {
        this.announcer.announce(text.loading, 'polite');
      } else if (this.posts.error()) {
        this.announcer.announce(untracked(this.errorMessage), 'polite');
      } else if (this.posts.value()) {
        this.announcer.announce(text.count(this.posts.value()!.length), 'polite');
      }
    });
  }
}

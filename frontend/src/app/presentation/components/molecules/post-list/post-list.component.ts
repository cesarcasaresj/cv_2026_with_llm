import { Component, computed, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { components } from '../../../../core/api/generated';

type PostSummary = components['schemas']['PostSummary'];

const GENERIC_ERROR = 'No pudimos cargar los artículos. Intenta de nuevo en unos minutos.';

/** Lista de artículos publicados, con filtros opcionales de categoría y etiqueta (spec.md, HU-07 y HU-11). */
@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.css',
})
export class PostListComponent {
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

  /** Si el filtro no existe (404), el backend explica cuál; para el resto de errores, un mensaje genérico. */
  protected readonly errorMessage = computed(() => {
    const error = this.posts.error();
    if (error instanceof HttpErrorResponse && error.status === 404) {
      return (error.error as { message?: string } | null)?.message ?? GENERIC_ERROR;
    }
    return GENERIC_ERROR;
  });

  constructor() {
    // Al cambiar de filtro se anuncia cuántos artículos hay (HU-07)
    effect(() => {
      if (this.posts.isLoading()) {
        this.announcer.announce('Cargando artículos', 'polite');
      } else if (this.posts.error()) {
        this.announcer.announce(this.errorMessage(), 'polite');
      } else if (this.posts.value()) {
        const total = this.posts.value()!.length;
        this.announcer.announce(total === 1 ? '1 artículo' : `${total} artículos`, 'polite');
      }
    });
  }
}

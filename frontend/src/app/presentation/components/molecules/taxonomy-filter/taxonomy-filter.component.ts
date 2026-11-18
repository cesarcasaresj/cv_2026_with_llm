import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { components } from '../../../../core/api/generated';
import { I18nService } from '../../../../core/i18n/i18n.service';

type TaxonomySummary = components['schemas']['TaxonomySummary'];

let nextId = 0;

/**
 * Filtro por categoría o por etiqueta (spec.md, HU-06, HU-07 y HU-11).
 * Cada término es un enlace que pone su slug en la URL: el filtro se puede compartir,
 * funciona sin JavaScript (SSR) y los buscadores pueden seguirlo.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-taxonomy-filter',
  templateUrl: './taxonomy-filter.component.html',
  styleUrl: './taxonomy-filter.component.css',
})
export class TaxonomyFilterComponent {
  private readonly announcer = inject(LiveAnnouncer);
  protected readonly t = inject(I18nService).t;

  /** Título visible de la sección, por ejemplo "Categorías". */
  readonly heading = input.required<string>();
  /** Endpoint del contrato: /api/v1/categories o /api/v1/tags. */
  readonly endpoint = input.required<string>();
  /** Parámetro de la URL que guarda el filtro: "categoria" o "etiqueta". */
  readonly queryParam = input.required<string>();
  /** Slug activo, o null si no hay filtro. */
  readonly selectedSlug = input<string | null>(null);

  /** Id único por instancia: la portada tiene dos filtros y los id no pueden repetirse. */
  protected readonly titleId = `taxonomy-filter-title-${nextId++}`;

  protected readonly terms = httpResource<TaxonomySummary[]>(() => this.endpoint());

  /** El título en minúsculas, para usarlo dentro de una frase: "Cargando categorías…". */
  protected readonly label = computed(() => this.heading().toLowerCase());

  constructor() {
    // Anuncia cada cambio de estado en el contenedor global aria-live="polite" (no se repite al cambiar de idioma)
    effect(() => {
      const text = untracked(this.t).taxonomy;
      const label = untracked(this.label);
      if (this.terms.isLoading()) {
        this.announcer.announce(text.loading(label), 'polite');
      } else if (this.terms.error()) {
        this.announcer.announce(text.announceError(label), 'polite');
      }
    });
  }

  /** Enlace del término: si ya está activo, lo quita; si no, lo aplica y mantiene los demás filtros. */
  protected queryParamsFor(slug: string): Record<string, string | null> {
    return { [this.queryParam()]: this.selectedSlug() === slug ? null : slug };
  }
}

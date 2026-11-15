import { Component, computed, effect, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { components } from '../../../../core/api/generated';

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

  private readonly label = computed(() => this.heading().toLowerCase());

  constructor() {
    // Anuncia cada cambio de estado en el contenedor global aria-live="polite"
    effect(() => {
      if (this.terms.isLoading()) {
        this.announcer.announce(`Cargando ${this.label()}`, 'polite');
      } else if (this.terms.error()) {
        this.announcer.announce(`No se pudieron cargar las ${this.label()}`, 'polite');
      }
    });
  }

  /** Enlace del término: si ya está activo, lo quita; si no, lo aplica y mantiene los demás filtros. */
  protected queryParamsFor(slug: string): Record<string, string | null> {
    return { [this.queryParam()]: this.selectedSlug() === slug ? null : slug };
  }
}

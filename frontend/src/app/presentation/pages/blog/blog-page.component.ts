import { Component, effect, inject, input } from '@angular/core';
import { SeoService } from '../../../core/seo/seo.service';
import { PostCounterComponent } from '../../components/molecules/post-counter/post-counter.component';
import { TaxonomyFilterComponent } from '../../components/molecules/taxonomy-filter/taxonomy-filter.component';
import { PostListComponent } from '../../components/molecules/post-list/post-list.component';

@Component({
  imports: [PostCounterComponent, TaxonomyFilterComponent, PostListComponent],
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent {
  private readonly seo = inject(SeoService);

  /** Filtros de la URL (?categoria=…&etiqueta=…), entregados por withComponentInputBinding. */
  readonly categoria = input<string | null>(null);
  readonly etiqueta = input<string | null>(null);

  constructor() {
    effect(() => {
      const params = new URLSearchParams();
      if (this.categoria()) params.set('categoria', this.categoria()!);
      if (this.etiqueta()) params.set('etiqueta', this.etiqueta()!);
      const query = params.toString();

      this.seo.setPage({
        title: 'Artículos',
        description: 'Artículos sobre arquitectura de software, seguridad, contratos de API y accesibilidad web.',
        path: query ? `/?${query}` : '/',
      });
    });
  }
}

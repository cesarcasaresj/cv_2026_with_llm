import { Component, effect, inject, input } from '@angular/core';
import { SeoService } from '../../../core/seo/seo.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { PostCounterComponent } from '../../components/molecules/post-counter/post-counter.component';
import { TaxonomyFilterComponent } from '../../components/molecules/taxonomy-filter/taxonomy-filter.component';
import { PostListComponent } from '../../components/molecules/post-list/post-list.component';

/** Blog (/blog): lista de artículos con filtros de categoría y etiqueta (spec.md, HU-06 a HU-11). */
@Component({
  imports: [PostCounterComponent, TaxonomyFilterComponent, PostListComponent],
  selector: 'app-blog-page',
  templateUrl: './blog-page.component.html',
  styleUrl: './blog-page.component.css',
  host: { class: 'l-page' },
})
export class BlogPageComponent {
  private readonly seo = inject(SeoService);
  protected readonly t = inject(I18nService).t;

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
        title: this.t().blog.title,
        description: this.t().blog.intro,
        path: query ? `/blog?${query}` : '/blog',
      });
    });
  }
}

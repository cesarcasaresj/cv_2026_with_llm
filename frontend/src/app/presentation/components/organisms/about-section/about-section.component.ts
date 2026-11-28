import { Component, computed, inject, input } from '@angular/core';
import type { Profile } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { SectionHeadingComponent } from '../../atoms/section-heading/section-heading.component';
import { PlayerCardComponent } from '../../molecules/player-card/player-card.component';
import { I18nService } from '../../../../core/i18n/i18n.service';

/** Retrato de la tarjeta (public/images/perfil): cesar-400.avif, cesar-800.webp… */
export const PORTRAIT = '/images/perfil/cesar';

/**
 * "Acerca de mí" (spec.md, HU-14 y HU-23): la tarjeta con la foto y el resumen completo, a la vista.
 * Las cifras (años, empresas) ya están en el inicio: aquí no se repiten.
 */
@Component({
  imports: [SectionHeadingComponent, PlayerCardComponent],
  selector: 'app-about-section',
  templateUrl: './about-section.component.html',
  styleUrl: './about-section.component.css',
})
export class AboutSectionComponent {
  protected readonly t = inject(I18nService).t;
  protected readonly portrait = PORTRAIT;

  readonly profile = input<Profile | null>(null);
  readonly state = input.required<ListState>();
  /** Número de proyectos públicos, o null si aún no se conoce (se conserva por compatibilidad con la página). */
  readonly projectCount = input<number | null>(null);

  /** Cargo de la tarjeta: la primera parte del titular ("Frontend Engineer · Angular…" → "Frontend Engineer"). */
  protected readonly role = computed(() => this.profile()?.headline.split('·')[0].trim() ?? '');
}

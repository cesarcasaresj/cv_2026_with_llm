import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import type { PortalSection } from '../../../portal/section-portal.service';

/**
 * Tarjeta con una mini escena animada que se despliega bajo un enlace del menú al pasar el ratón o llegar
 * con el teclado (spec.md, HU-21). Cada escena cuenta su sección:
 * - Experiencia: un maletín que avanza saltando mientras pasan los años.
 * - Sobre mí: el autor en el centro y, orbitando, lo que le inspira (música, arte, ideas, código).
 * - Proyectos: ventanas de código que aparecen y se escriben solas.
 * - Actualidad: un móvil con publicaciones que suben como un feed, en directo.
 * - Blog: un libro abierto y un lápiz que escribe.
 * Es decorativa (aria-hidden): el enlace ya dice adónde lleva.
 */
@Component({
  selector: 'app-nav-preview',
  templateUrl: './nav-preview.component.html',
  styleUrl: './nav-preview.component.css',
  host: { 'aria-hidden': 'true' },
})
export class NavPreviewComponent {
  private readonly t = inject(I18nService).t;

  readonly section = input.required<PortalSection>();

  protected readonly caption = computed(() => this.t().header.previews[this.section()]);
  protected readonly years = [2016, 2019, 2022, 2025];
  protected readonly inspirations = ['🎵', '🎨', '💡', '</>'];
  protected readonly windows = [0, 1, 2];
  protected readonly posts = [0, 1, 2, 3];
}

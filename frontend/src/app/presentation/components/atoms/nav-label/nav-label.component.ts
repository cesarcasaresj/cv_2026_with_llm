import { Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import type { PortalSection } from '../../../portal/section-portal.service';

/**
 * Texto de un enlace del menú que cobra vida al pulsarlo (spec.md, HU-21). Cada sección cuenta su historia:
 * Experiencia sube como niveles (+XP), Sobre mí nace de letras dispersas (❤), Proyectos cae como bloques ({ }),
 * Actualidad parpadea como una señal en directo y Blog se escribe a máquina con su cursor.
 *
 * Los lectores de pantalla leen el texto completo una sola vez (las letras animadas son aria-hidden);
 * el distintivo es decorativo. Cada valor nuevo de `run` repite la animación.
 */
@Component({
  selector: 'app-nav-label',
  templateUrl: './nav-label.component.html',
  styleUrl: './nav-label.component.css',
})
export class NavLabelComponent {
  private readonly t = inject(I18nService).t;

  readonly text = input.required<string>();
  readonly section = input.required<PortalSection>();
  /** 0: quieto. Cada valor nuevo reproduce el efecto de la sección. */
  readonly run = input(0);

  protected readonly letters = computed(() => [...this.text()]);

  /** Distintivo que acompaña al efecto de cada sección. */
  protected readonly badge = computed(() => {
    const badges: Record<PortalSection, string> = {
      experience: '+XP',
      about: '❤',
      projects: '{ }',
      updates: this.t().header.live,
      blog: '▍',
    };
    return badges[this.section()];
  });
}

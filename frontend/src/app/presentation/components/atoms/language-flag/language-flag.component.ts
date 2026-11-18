import { Component, computed, input } from '@angular/core';
import type { Lang } from '../../../../core/i18n/lang';

/** Bandera de cada idioma: una bandera es de un país, no de un idioma (inglés → EE. UU., español → España). */
export const FLAG_IMAGES: Record<Lang, string> = {
  en: '/images/flags/us.svg',
  es: '/images/flags/es.svg',
};

/** Número de franjas verticales: cada una sube y baja con un pequeño retraso, y juntas parecen una tela ondeando. */
const SLICES = 24;

/**
 * Bandera cartoon que aparece al cambiar de idioma (spec.md, HU-21): EE. UU. para inglés y España para español.
 * Entra con un rebote, ondea y se va en poco más de un segundo. Es decorativa (aria-hidden): el cambio de idioma
 * ya se anuncia con texto. Cada valor nuevo de `run` vuelve a empezar la animación.
 */
@Component({
  selector: 'app-language-flag',
  templateUrl: './language-flag.component.html',
  styleUrl: './language-flag.component.css',
  host: { 'aria-hidden': 'true' },
})
export class LanguageFlagComponent {
  readonly lang = input.required<Lang>();
  /** Contador de cambios: al cambiar, la bandera se crea de nuevo y su animación se repite. */
  readonly run = input(0);

  protected readonly image = computed(() => `url(${FLAG_IMAGES[this.lang()]})`);
  protected readonly slices = Array.from({ length: SLICES }, (_, index) => index);
  protected readonly sparkles = [0, 1, 2, 3, 4, 5];
}

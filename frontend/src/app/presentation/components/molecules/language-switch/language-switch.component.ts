import { Component, computed, inject, input, output, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { LANGS, type Lang } from '../../../../core/i18n/lang';
import { FLAG_IMAGES } from '../../atoms/language-flag/language-flag.component';

/** Colores del confeti: los de cada bandera. */
const FLAG_COLORS: Record<Lang, readonly string[]> = {
  en: ['#e63946', '#f8fafc', '#1d3a8a'],
  es: ['#c60b1e', '#ffc400'],
};

/** Saludo en el idioma al que se cambia (decorativo: el cambio ya se anuncia con texto). */
const GREETINGS: Record<Lang, string> = { es: '¡Hola!', en: 'Hello!' };

interface Celebration {
  lang: Lang;
  /** La primera vez en la visita, el efecto es más grande. */
  big: boolean;
  run: number;
}

/**
 * Selector de idioma ES / EN (spec.md, HU-18 y HU-21): dos botones nativos con aria-pressed y una píldora
 * que se desliza hasta el idioma activo y lleva su bandera. Al elegir otro idioma, la píldora gira en 3D,
 * salta confeti con los colores de la bandera y aparece un saludo; la primera vez, todo más grande.
 * Es presentacional: recibe el idioma y avisa de la elección; quien lo usa decide qué hacer.
 */
@Component({
  selector: 'app-language-switch',
  templateUrl: './language-switch.component.html',
  styleUrl: './language-switch.component.css',
})
export class LanguageSwitchComponent {
  protected readonly i18n = inject(I18nService);

  readonly lang = input.required<Lang>();
  /** true sobre fondo oscuro: ajusta los colores para mantener el contraste. */
  readonly onNight = input(false);
  readonly selected = output<Lang>();

  protected readonly options = LANGS;
  protected readonly flag = computed(() => `url(${FLAG_IMAGES[this.lang()]})`);

  protected readonly celebration = signal<Celebration | null>(null);
  protected readonly pieces = computed(() => {
    const celebration = this.celebration();
    if (!celebration) return [];
    const colors = FLAG_COLORS[celebration.lang];
    return Array.from({ length: celebration.big ? 22 : 12 }, (_, index) => ({ index, color: colors[index % colors.length] }));
  });
  protected readonly greeting = computed(() => GREETINGS[this.celebration()?.lang ?? 'es']);

  protected choose(lang: Lang): void {
    if (lang === this.lang()) return;
    const previous = this.celebration();
    this.celebration.set({ lang, big: previous === null, run: (previous?.run ?? 0) + 1 });
    this.selected.emit(lang);
  }
}

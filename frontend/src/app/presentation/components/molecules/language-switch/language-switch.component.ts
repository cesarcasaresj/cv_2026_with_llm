import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { LANGS, type Lang } from '../../../../core/i18n/lang';

/**
 * Selector de idioma ES / EN (spec.md, HU-18): dos botones nativos con aria-pressed y una píldora que se desliza
 * hasta el idioma activo. Es presentacional: recibe el idioma y avisa de la elección; quien lo usa decide qué hacer.
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

  protected choose(lang: Lang): void {
    if (lang !== this.lang()) this.selected.emit(lang);
  }
}

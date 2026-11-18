import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import type { ThemeOrigin } from '../../../../core/theme/theme.service';

/**
 * Interruptor de modo claro / oscuro (spec.md, HU-22): un botón nativo con aria-pressed.
 * El dibujo (sol con rayos que se convierte en luna con estrellas) lo decide el CSS con la variable global
 * --is-dark, no una entrada: así coincide con el tema del sistema desde el primer pintado, sin parpadeo.
 * Es presentacional: avisa de la pulsación y desde dónde, para que el nuevo tema se expanda desde el botón.
 */
@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css',
})
export class ThemeToggleComponent {
  protected readonly t = inject(I18nService).t;

  /** true si el modo oscuro está activo (aria-pressed). */
  readonly dark = input.required<boolean>();
  readonly toggled = output<ThemeOrigin>();

  protected press(button: HTMLElement): void {
    const box = button.getBoundingClientRect();
    this.toggled.emit({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  }
}

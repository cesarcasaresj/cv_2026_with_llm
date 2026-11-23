import { Component, ElementRef, inject, input } from '@angular/core';
import { hasFinePointer, prefersReducedMotion } from '../../../motion/motion';

/**
 * Tarjeta de personaje de "Acerca de mí" (spec.md, HU-23): un póster hecho de capas de papel
 * (cielo, sol, ciudad, la persona y su nombre) que parece 3D.
 *
 * - Sola, se balancea despacio de lado a lado. Con el ratón encima, se inclina hacia el puntero y cada capa
 *   se desplaza a su propia velocidad (paralaje). La persona sobresale por arriba del marco.
 * - Solo escribe dos variables CSS (--mx, --my, de -0,5 a 0,5); el estilo hace el resto.
 * - Con "reducir movimiento" queda quieta. En pantallas táctiles solo se balancea.
 * - Es una figura con su texto alternativo; las capas de decoración están ocultas a los lectores de pantalla.
 */
@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.css',
  host: {
    '(pointermove)': 'move($event)',
    '(pointerleave)': 'reset()',
  },
})
export class PlayerCardComponent {
  readonly name = input.required<string>();
  /** Clase del personaje: el rol principal, por ejemplo "Frontend Engineer". */
  readonly role = input.required<string>();
  /** Nivel que muestra la insignia (años de experiencia). */
  readonly level = input<number | null>(null);
  readonly levelLabel = input('LVL');
  readonly alt = input.required<string>();
  /** Ruta de las imágenes sin tamaño ni extensión: `/images/perfil/cesar` → cesar-400.avif, cesar-800.webp… */
  readonly image = input('/images/perfil/cesar');

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private frame = 0;

  protected move(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !hasFinePointer() || prefersReducedMotion()) return;
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const rect = this.element.getBoundingClientRect();
      const style = this.element.style;
      style.setProperty('--mx', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
      style.setProperty('--my', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
      this.element.classList.add('is-pointing');
    });
  }

  protected reset(): void {
    cancelAnimationFrame(this.frame);
    this.element.style.removeProperty('--mx');
    this.element.style.removeProperty('--my');
    this.element.classList.remove('is-pointing');
  }
}

import { Directive, ElementRef, inject } from '@angular/core';
import { hasFinePointer, prefersReducedMotion } from './motion';

const MAX_DEGREES = 8;

/**
 * Inclinación 3D que sigue al puntero, con un brillo que se mueve con él.
 * Solo escribe variables CSS (--tilt-x, --tilt-y, --glare-x, --glare-y): el estilo decide qué hacer con ellas.
 * Desactivada en pantallas táctiles y con "reducir movimiento".
 */
@Directive({
  selector: '[appTilt]',
  host: {
    '(pointermove)': 'move($event)',
    '(pointerleave)': 'reset()',
  },
})
export class TiltDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private frame = 0;

  protected move(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || !hasFinePointer() || prefersReducedMotion()) return;

    // Un cálculo por fotograma, aunque lleguen muchos eventos
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const rect = this.element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width; // 0 a 1
      const y = (event.clientY - rect.top) / rect.height;
      const style = this.element.style;
      style.setProperty('--tilt-x', `${((0.5 - y) * MAX_DEGREES * 2).toFixed(2)}deg`);
      style.setProperty('--tilt-y', `${((x - 0.5) * MAX_DEGREES * 2).toFixed(2)}deg`);
      style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`);
      style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`);
      this.element.classList.add('is-tilting');
    });
  }

  protected reset(): void {
    cancelAnimationFrame(this.frame);
    for (const property of ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y']) {
      this.element.style.removeProperty(property);
    }
    this.element.classList.remove('is-tilting');
  }
}

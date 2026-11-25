import { Component, DestroyRef, ElementRef, afterNextRender, effect, inject, input, signal, viewChild } from '@angular/core';
import { hasFinePointer, prefersReducedMotion } from '../../../motion/motion';
import type { OrbScene } from './orb-scene';

/**
 * Esfera de energía 3D del botón "Pregúntale a mi CV" (spec.md, HU-24). Decorativa (aria-hidden).
 *
 * Se ve al instante una versión hecha con CSS; cuando el navegador queda libre se descarga three.js (aparte, sin
 * pesar en la carga inicial) y la sustituye una esfera WebGL que late, gira y se inclina hacia el puntero.
 * Con "reducir movimiento", en el servidor o sin WebGL, se queda la versión CSS, sin animación.
 */
@Component({
  selector: 'app-assistant-orb',
  templateUrl: './assistant-orb.component.html',
  styleUrl: './assistant-orb.component.css',
  host: {
    'aria-hidden': 'true',
    '[class.orb--live]': 'live()',
    '[class.orb--excited]': 'excited()',
  },
})
export class AssistantOrbComponent {
  /** true con el cursor o el foco en el botón: la esfera se activa. */
  readonly excited = input(false);

  protected readonly live = signal(false);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private scene: OrbScene | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let destroyed = false;

    effect(() => this.scene?.setExcited(this.excited()));

    afterNextRender(() => {
      if (prefersReducedMotion()) return;
      const start = (): void => {
        import('./orb-scene')
          .then(({ createOrbScene }) => {
            if (destroyed) return;
            this.scene = createOrbScene(this.canvas().nativeElement);
            if (!this.scene) return;
            this.scene.setExcited(this.excited());
            this.live.set(true);
          })
          .catch(() => undefined); // Sin la descarga, se queda la versión CSS
      };
      // Cuando el navegador esté libre: la esfera nunca compite con el contenido de la página
      if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 3000 });
      else setTimeout(start, 1500);

      // Con ratón, la esfera mira hacia el puntero (en pantallas táctiles no tiene sentido)
      if (!hasFinePointer()) return;
      const onPointer = (event: PointerEvent): void => {
        if (!this.scene) return;
        const box = host.getBoundingClientRect();
        const reach = 320; // px: a esa distancia del centro, la inclinación es máxima
        this.scene.setPointer(
          (event.clientX - (box.left + box.width / 2)) / reach,
          (event.clientY - (box.top + box.height / 2)) / reach,
        );
      };
      window.addEventListener('pointermove', onPointer, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('pointermove', onPointer));
    });

    destroyRef.onDestroy(() => {
      destroyed = true;
      this.scene?.dispose();
      this.scene = null;
    });
  }
}

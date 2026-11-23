import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { prefersReducedMotion } from '../../../motion/motion';
import { onceVisible } from '../../../motion/visible';

const COUNT_MS = 1200;

/** Cuadros del calendario de contribuciones (variante open source): 0 apagado … 3 muy activo. */
const CONTRIBUTIONS = [
  0, 1, 2, 0, 3, 1, 0, 2, 3, 1, 0, 2, 1, 3, 0, 1, 2, 3, 2, 0, 1, 3, 1, 0, 2, 2, 3, 1, 0, 1, 3, 2, 1, 2, 3,
] as const;

/**
 * Logro de "Acerca de mí" como subida de nivel de videojuego (spec.md, HU-23): la cifra cuenta desde 0,
 * se llena la barra de experiencia y salta un "LEVEL UP!".
 *
 * - La variante `open-source` muestra un calendario de contribuciones que se enciende y un enlace a GitHub.
 * - En el servidor, sin JavaScript o con "reducir movimiento", se ve directamente el estado final.
 * - La cifra que cambia está oculta a los lectores de pantalla: ellos leen solo el valor final.
 * - Cuenta solo al entrar en pantalla y nunca suena: el sonido del sitio es solo para acciones (HU-19).
 */
@Component({
  selector: 'app-level-stat',
  templateUrl: './level-stat.component.html',
  styleUrl: './level-stat.component.css',
  host: {
    '[class.is-armed]': 'phase() !== "idle"',
    '[class.is-counting]': 'phase() === "counting" || phase() === "done"',
    '[class.is-done]': 'phase() === "done"',
    '[class.is-open-source]': 'variant() === "open-source"',
  },
})
export class LevelStatComponent {
  readonly value = input.required<number>();
  readonly suffix = input('');
  readonly label = input.required<string>();
  /** Frase del logro, por ejemplo "Nivel 10 alcanzado". */
  readonly achievement = input<string | null>(null);
  readonly badge = input('LEVEL UP!');
  readonly variant = input<'level' | 'open-source'>('level');
  readonly href = input<string | null>(null);
  readonly linkLabel = input<string | null>(null);

  protected readonly contributions = CONTRIBUTIONS;
  /** idle: estado final (servidor) · armed: en 0, esperando · counting · done */
  protected readonly phase = signal<'idle' | 'armed' | 'counting' | 'done'>('idle');
  private readonly counted = signal<number | null>(null);
  protected readonly display = computed(() => `${this.counted() ?? this.value()}${this.suffix()}`);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    let frame = 0;
    destroyRef.onDestroy(() => cancelAnimationFrame(frame));

    afterNextRender(() => {
      if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') return;
      this.phase.set('armed');
      this.counted.set(0);
      onceVisible(element, () => {
        this.phase.set('counting');
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / COUNT_MS, 1);
          const eased = 1 - (1 - progress) ** 3;
          this.counted.set(Math.round(eased * this.value()));
          if (progress < 1) {
            frame = requestAnimationFrame(step);
          } else {
            this.counted.set(null);
            this.phase.set('done');
          }
        };
        frame = requestAnimationFrame(step);
      }, destroyRef);
    });
  }
}

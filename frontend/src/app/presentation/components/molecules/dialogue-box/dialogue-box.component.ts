import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { prefersReducedMotion } from '../../../motion/motion';
import { onceVisible } from '../../../motion/visible';

/** Letras que aparecen en cada paso de la máquina de escribir, y cada cuánto (ms). */
const CHARS_PER_TICK = 2;
const TICK_MS = 22;

/**
 * Caja de diálogo de videojuego (spec.md, HU-23): el texto de "Acerca de mí" se escribe letra a letra,
 * un párrafo cada vez, con un botón ▼ para pasar al siguiente.
 *
 * - Todo el texto está siempre en la página, en una lista oculta solo a la vista: lectores de pantalla y
 *   buscadores lo leen completo. La caja visible es decoración (aria-hidden).
 * - Empieza a escribir cuando la caja entra en pantalla. Pulsar ▼ mientras escribe muestra el párrafo entero.
 * - En el servidor y con "reducir movimiento", el párrafo aparece completo, sin animación.
 */
@Component({
  selector: 'app-dialogue-box',
  templateUrl: './dialogue-box.component.html',
  styleUrl: './dialogue-box.component.css',
})
export class DialogueBoxComponent {
  readonly speaker = input.required<string>();
  readonly paragraphs = input.required<readonly string[]>();
  /** Miniatura de quien habla (opcional). */
  readonly portrait = input<string | null>(null);
  readonly nextLabel = input('Siguiente');
  readonly restartLabel = input('Volver a empezar');

  protected readonly page = signal(0);
  /** Letras ya escritas del párrafo actual; null = el párrafo completo. */
  private readonly typed = signal<number | null>(null);
  private timer: ReturnType<typeof setInterval> | undefined;

  protected readonly current = computed(() => this.paragraphs()[this.page()] ?? '');
  protected readonly shown = computed(() => {
    const typed = this.typed();
    return typed === null ? this.current() : this.current().slice(0, typed);
  });
  protected readonly typing = computed(() => this.typed() !== null);
  protected readonly last = computed(() => this.page() >= this.paragraphs().length - 1);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.stop());
    afterNextRender(() => {
      if (prefersReducedMotion()) return;
      onceVisible(element, () => this.type(), destroyRef);
    });
  }

  /** ▼: si está escribiendo, termina el párrafo; si no, pasa al siguiente (o vuelve al primero). */
  protected advance(): void {
    if (this.typing()) {
      this.stop();
      this.typed.set(null);
      return;
    }
    this.page.set(this.last() ? 0 : this.page() + 1);
    if (prefersReducedMotion()) return;
    this.type();
  }

  private type(): void {
    this.stop();
    this.typed.set(0);
    this.timer = setInterval(() => {
      const next = (this.typed() ?? 0) + CHARS_PER_TICK;
      if (next >= this.current().length) {
        this.stop();
        this.typed.set(null);
      } else {
        this.typed.set(next);
      }
    }, TICK_MS);
  }

  private stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}

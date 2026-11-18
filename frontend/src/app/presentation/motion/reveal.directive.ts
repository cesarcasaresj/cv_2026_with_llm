import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Aparición al hacer scroll: el elemento entra deslizándose cuando llega a la pantalla.
 *
 * Mejora progresiva: el HTML del servidor siempre es visible. Solo en el navegador, y solo para lo que
 * aún está fuera de la pantalla, se añade `reveal` (oculto) y después `reveal--visible`.
 * Con "reducir movimiento" el elemento solo se funde, sin desplazarse.
 *
 * Uso: `<li appReveal [revealDelay]="i * 80">`
 */
@Directive({
  selector: '[appReveal]',
  host: { '[style.--reveal-delay.ms]': 'revealDelay()' },
})
export class RevealDirective {
  /** Retraso en milisegundos, para escalonar elementos de una lista. */
  readonly revealDelay = input(0);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      // Con "reducir movimiento" también aparece, pero solo con un fundido (ver .reveal en styles.css)
      if (typeof IntersectionObserver === 'undefined') return;
      // Lo que ya se ve al cargar no se oculta: evitaría un parpadeo
      if (element.getBoundingClientRect().top < window.innerHeight) return;

      element.classList.add('reveal');
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          element.classList.add('reveal--visible');
          observer.disconnect();
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}

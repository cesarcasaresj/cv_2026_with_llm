import { Component, ElementRef, PLATFORM_ID, effect, inject, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');

  /**
   * Navegaciones dentro de la aplicación. Se omite la primera (la carga inicial):
   * ahí el navegador ya empieza desde arriba y mover el foco saltaría el enlace "Saltar al contenido".
   */
  private readonly lastNavigation = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      skip(1),
    ),
  );

  constructor() {
    // Tras cada cambio de ruta, el foco vuelve al <main> para que el lector de pantalla anuncie la página nueva.
    // En el servidor no hay foco que mover.
    effect(() => {
      if (this.isBrowser && this.lastNavigation()) {
        this.main()?.nativeElement.focus();
      }
    });
  }

  /** "Saltar al contenido": lleva el foco al <main> sin cambiar la URL (un href="#..." cambiaría de ruta). */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main()?.nativeElement.focus();
  }
}

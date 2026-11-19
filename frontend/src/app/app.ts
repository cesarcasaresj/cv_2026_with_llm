import { Component, DOCUMENT, ElementRef, PLATFORM_ID, effect, inject, viewChild } from '@angular/core';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { SiteHeaderComponent } from './presentation/components/organisms/site-header/site-header.component';
import { I18nService } from './core/i18n/i18n.service';
import { SectionPortalComponent } from './presentation/portal/section-portal.component';

@Component({
  imports: [RouterOutlet, SiteHeaderComponent, SectionPortalComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
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
    // El router hace scroll a las anclas con window.scrollTo, que ignora scroll-padding-top:
    // se le indica la altura real de la cabecera fija para que no tape el título de la sección.
    if (this.isBrowser) {
      inject(ViewportScroller).setOffset(() => [
        0,
        (this.document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0) + 16,
      ]);
    }

    // Tras cada cambio de ruta, el foco va al contenido nuevo para que el lector de pantalla lo anuncie:
    // a la sección pedida si la URL lleva ancla (/#proyectos), o al <main> si no. En el servidor no hay foco.
    effect(() => {
      const navigation = this.lastNavigation();
      if (!this.isBrowser || !navigation) return;

      const fragment = this.router.parseUrl(navigation.urlAfterRedirects).fragment;
      const target = fragment ? this.document.getElementById(fragment) : null;
      // preventScroll: el router ya hizo el scroll hasta el ancla (withInMemoryScrolling)
      (target ?? this.main()?.nativeElement)?.focus({ preventScroll: !!target });
    });
  }

  /** "Saltar al contenido": lleva el foco al <main> sin cambiar la URL (un href="#..." cambiaría de ruta). */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    this.main()?.nativeElement.focus();
  }
}

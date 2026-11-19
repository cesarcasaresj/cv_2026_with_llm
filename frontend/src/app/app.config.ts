import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient } from '@angular/common/http';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';

/** La ruta más profunda de una navegación: la que decide qué página se ve. */
function leaf(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return snapshot.firstChild ? leaf(snapshot.firstChild) : snapshot;
}

// Datos de fechas y números en español. El inglés ("en") viene incluido en Angular.
// Cada pipe date recibe el idioma activo (I18nService.lang): "15 de noviembre de 2026" o "November 15, 2026".
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Con SSR, las respuestas que pidió el servidor se reutilizan al hidratar (no se piden dos veces)
    provideHttpClient(),
    // Los parámetros de ruta y de consulta llegan como inputs de las páginas (slug, categoria, etiqueta)
    // - withInMemoryScrolling: los enlaces /#proyectos llevan a la sección y "atrás" recupera la posición
    // - withViewTransitions: animación entre páginas (styles.css); se omite en la carga inicial y al ir a un ancla
    //   de la misma página (/#proyectos): ahí no cambia la página y el portal de la sección ya acompaña el salto
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: ({ transition, from, to }) => {
          const [before, after] = [leaf(from), leaf(to)];
          const samePage = before.routeConfig === after.routeConfig && JSON.stringify(before.params) === JSON.stringify(after.params);
          if (samePage) transition.skipTransition();
        },
      }),
    ),
    // Idioma por defecto de los pipes que no reciben uno; el idioma activo lo decide I18nService (HU-18)
    { provide: LOCALE_ID, useValue: 'es' },
    provideClientHydration(withEventReplay()),
  ],
};

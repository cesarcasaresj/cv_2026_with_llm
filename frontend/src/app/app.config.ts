import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';

// Fechas y números en español (por ejemplo "15 de noviembre de 2026" en vez de "November 15, 2026")
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Con SSR, las respuestas que pidió el servidor se reutilizan al hidratar (no se piden dos veces)
    provideHttpClient(),
    // Los parámetros de ruta y de consulta llegan como inputs de las páginas (slug, categoria, etiqueta)
    provideRouter(routes, withComponentInputBinding()),
    { provide: LOCALE_ID, useValue: 'es' },
    provideClientHydration(withEventReplay()),
  ],
};

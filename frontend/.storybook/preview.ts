import type { Preview } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';

// Mismo idioma que la aplicación (src/app/app.config.ts): las stories muestran fechas en español
registerLocaleData(localeEs);

const preview: Preview = {
  // Router vacío y sin navegación inicial: los enlaces (routerLink) se pintan, pero el router
  // no intenta interpretar la URL de Storybook (iframe.html) como una ruta de la aplicación
  decorators: [
    applicationConfig({
      providers: [{ provide: LOCALE_ID, useValue: 'es' }, provideRouter([], withDisabledInitialNavigation())],
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;

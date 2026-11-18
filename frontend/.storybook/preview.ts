import type { Decorator, Preview } from '@storybook/angular-vite';
import { applicationConfig } from '@storybook/angular-vite';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { INITIAL_LANG } from '../src/app/core/i18n/i18n.service';
import { isLang } from '../src/app/core/i18n/lang';
// Los mismos estilos globales que la aplicación: variables de color, .l-container, .reveal…
// Sin ellos las stories no muestran los colores reales y axe mide un contraste que no existe en la app.
import '../src/styles.css';

// Mismos datos de idioma que la aplicación (src/app/app.config.ts); el inglés ya viene incluido en Angular
registerLocaleData(localeEs);

/**
 * Idioma de la barra de herramientas (HU-18): cada story se pinta en español o en inglés con los mismos
 * diccionarios que la aplicación. Así se revisan los dos idiomas y el panel A11y los mide a ambos.
 */
const withLanguage: Decorator = (story, context) => {
  const lang = isLang(context.globals['lang']) ? context.globals['lang'] : 'es';
  return applicationConfig({ providers: [{ provide: INITIAL_LANG, useValue: lang }] })(story, context);
};

const preview: Preview = {
  globalTypes: {
    lang: {
      description: 'Idioma de la interfaz / Interface language',
      toolbar: {
        title: 'Idioma',
        icon: 'globe',
        items: [
          { value: 'es', title: 'Español' },
          { value: 'en', title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { lang: 'es' },

  // Router vacío y sin navegación inicial: los enlaces (routerLink) se pintan, pero el router
  // no intenta interpretar la URL de Storybook (iframe.html) como una ruta de la aplicación
  decorators: [
    withLanguage,
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

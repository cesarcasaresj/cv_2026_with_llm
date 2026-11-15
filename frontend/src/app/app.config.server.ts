import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { SITE_URL } from './core/seo/seo.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // En producción, el origen público (canonical, og:url) no tiene por qué coincidir con el de la petición interna
    ...(process.env['PUBLIC_SITE_URL'] ? [{ provide: SITE_URL, useValue: process.env['PUBLIC_SITE_URL'] }] : []),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

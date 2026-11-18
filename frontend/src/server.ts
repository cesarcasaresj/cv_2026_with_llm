import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'node:path';
import { negotiateLang } from './app/core/i18n/lang';

const browserDistFolder = join(import.meta.dirname, '../browser');

// Dirección interna del backend. El navegador nunca la ve: todo pasa por este servidor (mismo origen, sin CORS).
const backendUrl = process.env['BACKEND_URL'] ?? 'http://localhost:8081';

// Dominios que este servidor acepta en la cabecera Host (protección de Angular contra SSRF).
// En producción: ALLOWED_HOSTS=midominio.com,www.midominio.com
const allowedHosts = (process.env['ALLOWED_HOSTS'] ?? 'localhost')
  .split(',')
  .map((host) => host.trim())
  .filter((host) => host.length > 0);

const app = express();
const angularApp = new AngularNodeAppEngine({ allowedHosts });

/**
 * La API y los archivos de SEO los responde el backend (spec.md, HU-12).
 * En desarrollo hace lo mismo proxy.conf.json; esto es para el servidor de producción.
 */
app.use(
  createProxyMiddleware({
    target: backendUrl,
    pathFilter: ['/api', '/sitemap.xml', '/robots.txt'],
  }),
);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Idioma de la página (spec.md, HU-18): la misma URL sirve español o inglés según la cookie `lang`
 * o el idioma del navegador. Vary avisa a las cachés de que la respuesta depende de esas cabeceras.
 */
app.use((req, res, next) => {
  res.setHeader('Vary', 'Cookie, Accept-Language');
  res.setHeader('Content-Language', negotiateLang(req.headers.cookie ?? null, req.headers['accept-language'] ?? null));
  next();
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Arranca el servidor si este módulo es el principal, si lo lanza PM2 o si lo lanza Passenger
 * (cPanel → Setup Node.js App, que lo carga desde deploy/app.cjs y define PASSENGER_APP_ENV).
 * Escucha en `PORT` (por defecto 4000); con Passenger, el puerto lo decide Passenger.
 */
const startedByPassenger = Boolean(process.env['PASSENGER_APP_ENV']) || 'PhusionPassenger' in globalThis;
if (isMainModule(import.meta.url) || process.env['pm_id'] || startedByPassenger) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

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
import { addScriptNonce, securityHeaders } from './security-headers';

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

// No anunciar el servidor ("X-Powered-By: Express")
app.disable('x-powered-by');
// CSP, anti-iframe, Referrer-Policy, Permissions-Policy… (security-headers.ts).
// Va antes del proxy: las respuestas de la API llegan con las cabeceras del backend, que las reemplazan.
app.use(securityHeaders({ dev: process.env['NODE_ENV'] !== 'production' }));

/**
 * La API y los archivos de SEO los responde el backend (spec.md, HU-12).
 * En desarrollo hace lo mismo proxy.conf.json; esto es para el servidor de producción.
 */
app.use(
  createProxyMiddleware({
    target: backendUrl,
    pathFilter: ['/api', '/sitemap.xml', '/robots.txt'],
    // El proxy presenta el nombre del backend (api.…), no el de esta petición: así el hosting,
    // que sirve varios sitios en la misma IP, entrega la petición a la app correcta
    changeOrigin: true,
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
  // CF-Timezone: sin elección guardada, el tema depende de la hora del visitante (HU-27)
  res.setHeader('Vary', 'Cookie, Accept-Language, CF-Timezone');
  res.setHeader('Content-Language', negotiateLang(req.headers.cookie ?? null, req.headers['accept-language'] ?? null));
  next();
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) return next();
      // Los scripts en línea de Angular reciben el nonce de esta respuesta (Content-Security-Policy)
      if (response.headers.get('content-type')?.includes('text/html')) {
        const html = addScriptNonce(await response.text(), res.locals['cspNonce']);
        response = new Response(html, { status: response.status, statusText: response.statusText, headers: response.headers });
      }
      return writeResponseToNodeResponse(response, res);
    })
    .catch(next);
});

/**
 * Arranca el servidor si este módulo es el principal, si lo lanza PM2 o si lo lanza el hosting
 * (cPanel → Setup Node.js App, que lo carga desde deploy/app.cjs):
 * - Passenger (Apache) define PASSENGER_APP_ENV;
 * - LiteSpeed (lsnode, el de Namecheap) define LSNODE_ROOT y redirige listen() a su propio socket.
 * Escucha en `PORT` (por defecto 4000); con Passenger o LiteSpeed, el hosting decide dónde escucha.
 */
const startedByHosting =
  Boolean(process.env['PASSENGER_APP_ENV'] || process.env['LSNODE_ROOT']) || 'PhusionPassenger' in globalThis;
if (isMainModule(import.meta.url) || process.env['pm_id'] || startedByHosting) {
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

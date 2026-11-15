import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { join } from 'node:path';

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
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
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

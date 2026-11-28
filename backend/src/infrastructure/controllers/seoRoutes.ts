import { Router } from 'express';
import type { ListSitemapEntries } from '../../core/usecases/ListSitemapEntries';

/**
 * sitemap.xml y robots.txt (spec.md, HU-12). `siteUrl` es el origen público del sitio
 * (por ejemplo https://midominio.com), no el del backend: los buscadores visitan el frontend.
 */
export function seoRoutes(listSitemapEntries: ListSitemapEntries, siteUrl: string): Router {
  const router = Router();

  router.get('/sitemap.xml', async (_request, response) => {
    const entries = await listSitemapEntries.execute();
    // Los slugs solo tienen minúsculas, números y guiones: no hace falta escapar nada en el XML
    const urls = [
      `  <url><loc>${siteUrl}/</loc></url>`,
      `  <url><loc>${siteUrl}/blog</loc></url>`,
      ...entries.map(
        (entry) =>
          `  <url><loc>${siteUrl}/articulos/${entry.slug}</loc><lastmod>${entry.updatedAt.toISOString()}</lastmod></url>`,
      ),
    ];

    response
      .type('application/xml')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  });

  router.get('/robots.txt', (_request, response) => {
    // Sin "Disallow: /login": solo le enseñaría a un atacante dónde está el panel. Login y cuenta ya
    // llevan <meta name="robots" content="noindex">, y su protección real está en el servidor (401 sin sesión).
    response.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  });

  return router;
}

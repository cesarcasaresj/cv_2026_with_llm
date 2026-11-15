import { RenderMode, ServerRoute } from '@angular/ssr';

// spec.md, decisión G: las páginas públicas se renderizan en el servidor para buscadores y redes sociales.
// Login y "Mi cuenta" dependen de la cookie de sesión y no aportan al SEO: se renderizan en el navegador.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'articulos/:slug', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'cuenta', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];

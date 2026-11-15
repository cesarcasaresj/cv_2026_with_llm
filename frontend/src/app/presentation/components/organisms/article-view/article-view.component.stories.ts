import type { Meta, StoryObj } from '@storybook/angular-vite';
import { ArticleViewComponent, type ArticleDetail } from './article-view.component';

const meta: Meta<ArticleViewComponent> = {
  title: 'Design System/Organisms/ArticleView',
  component: ArticleViewComponent,
};
export default meta;

type Story = StoryObj<ArticleViewComponent>;

const article: ArticleDetail = {
  id: 1,
  slug: 'secretos-con-vault',
  title: 'Secretos con HashiCorp Vault también en desarrollo local',
  seoTitle: 'Secretos con Vault en desarrollo local',
  description: 'Cómo leer las credenciales igual en local que en producción, sin contraseñas en el repositorio.',
  publishedAt: '2026-11-10T00:00:00Z',
  updatedAt: '2026-11-15T00:00:00Z',
  readingMinutes: 2,
  category: { id: 1, name: 'Seguridad', slug: 'seguridad' },
  tags: [
    { id: 1, name: 'Vault', slug: 'vault' },
    { id: 2, name: 'Node.js', slug: 'node-js' },
  ],
  // SVG en línea para la story: no depende de archivos generados por el script de carga
  cover: {
    avif: '',
    webp: '',
    fallback:
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0f172a"/><text x="600" y="330" font-size="60" fill="#f8fafc" text-anchor="middle" font-family="sans-serif">Backend → Vault → PostgreSQL</text></svg>',
      ),
    alt: 'Diagrama: el backend pide las credenciales a Vault y después se conecta a PostgreSQL.',
    decorative: false,
    width: 1200,
    height: 630,
  },
  bodyHtml:
    '<h2>El problema</h2><p>En muchos proyectos la contraseña vive en un archivo. Lee la <a href="https://developer.hashicorp.com/vault">documentación de Vault</a>.</p><h2>La solución</h2><ul><li>El código solo conoce la ruta.</li><li>Vault entrega el valor.</li></ul>',
  author: { name: 'Autor de ejemplo' },
};

export const Exito: Story = {
  args: { state: 'ready', article },
};

export const SinPortada: Story = {
  args: { state: 'ready', article: { ...article, cover: null, updatedAt: article.publishedAt } },
};

export const Cargando: Story = {
  args: { state: 'loading', article: null },
};

export const ConError: Story = {
  args: { state: 'error', article: null },
};

export const NoEncontrado: Story = {
  args: { state: 'not-found', article: null },
};

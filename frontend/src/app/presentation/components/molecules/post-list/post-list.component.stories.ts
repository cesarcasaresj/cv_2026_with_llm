import type { Meta, StoryObj } from '@storybook/angular-vite';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { PostListComponent } from './post-list.component';
import { mockBackend } from '../../../storybook/mock-backend';

const meta: Meta<PostListComponent> = {
  title: 'Design System/Molecules/PostList',
  component: PostListComponent,
};
export default meta;

type Story = StoryObj<PostListComponent>;

const arquitectura = { id: 1, name: 'Arquitectura', slug: 'arquitectura' };
const posts = [
  {
    id: 1,
    slug: 'contratos-openapi',
    title: 'Contratos OpenAPI como fuente de verdad',
    description: 'Por qué el contrato se cambia antes que el código y cómo generar los tipos de TypeScript.',
    publishedAt: '2026-11-14T00:00:00Z',
    category: arquitectura,
    tags: [],
    cover: null,
  },
  {
    id: 2,
    slug: 'secretos-con-vault',
    title: 'Secretos con HashiCorp Vault también en desarrollo local',
    description: 'Cómo leer las credenciales igual en local que en producción, sin contraseñas en el repositorio.',
    publishedAt: '2026-11-10T00:00:00Z',
    category: { id: 2, name: 'Seguridad', slug: 'seguridad' },
    tags: [],
    cover: null,
  },
];

export const Exito: Story = {
  decorators: [mockBackend(() => of(new HttpResponse({ status: 200, body: posts })))],
};

export const Cargando: Story = {
  decorators: [mockBackend(() => NEVER)], // La petición nunca termina
};

export const ConError: Story = {
  decorators: [mockBackend(() => throwError(() => new HttpErrorResponse({ status: 500 })))],
};

export const FiltroInexistente: Story = {
  args: { category: 'no-existe' },
  decorators: [
    mockBackend(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: { code: 'NOT_FOUND', message: 'No encontramos esa categoría.', timestamp: '2026-11-15T10:00:00Z' },
          }),
      ),
    ),
  ],
};

export const SinResultados: Story = {
  args: { category: 'arquitectura', tag: 'vault' },
  decorators: [mockBackend(() => of(new HttpResponse({ status: 200, body: [] })))],
};

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { PostCategoryListComponent } from './post-category-list.component';
import type { AuthorPost, ManagedCategory } from '../../../../core/author/author.service';

const meta: Meta<PostCategoryListComponent> = {
  title: 'Design System/Molecules/PostCategoryList',
  component: PostCategoryListComponent,
};
export default meta;

type Story = StoryObj<PostCategoryListComponent>;

const categories: ManagedCategory[] = [
  { id: 4, name: 'Accesibilidad', slug: 'accesibilidad', postCount: 1 },
  { id: 3, name: 'Seguridad', slug: 'seguridad', postCount: 1 },
  { id: 1, name: 'Sin clasificar', slug: 'sin-clasificar', postCount: 1 },
];

const posts: AuthorPost[] = [
  {
    id: 4,
    slug: 'accesibilidad-en-componentes-angular',
    title: 'Accesibilidad en componentes Angular',
    status: 'published',
    category: { id: 4, name: 'Accesibilidad', slug: 'accesibilidad' },
  },
  {
    id: 1,
    slug: 'borrador-1',
    title: 'Un borrador sin clasificar',
    status: 'draft',
    category: { id: 1, name: 'Sin clasificar', slug: 'sin-clasificar' },
  },
  {
    id: 3,
    slug: 'secretos-con-vault-en-desarrollo-local',
    title: 'Secretos con HashiCorp Vault también en desarrollo local',
    status: 'published',
    category: { id: 3, name: 'Seguridad', slug: 'seguridad' },
  },
];

export const Exito: Story = {
  args: { state: 'ready', posts, categories },
};

export const SinArticulos: Story = {
  args: { state: 'ready', posts: [], categories },
};

export const Cargando: Story = {
  args: { state: 'loading', posts: null, categories: null },
};

export const ConError: Story = {
  args: { state: 'error', posts: null, categories: null },
};

export const Guardando: Story = {
  args: { state: 'ready', posts, categories, savingPostId: 1 },
};

/** Respuesta 422 del backend: la categoría ya no existe (otra pestaña la borró). */
export const ErrorAlGuardar: Story = {
  args: { state: 'ready', posts, categories, errorMessage: 'Esa categoría no existe. Elige una de la lista.' },
};

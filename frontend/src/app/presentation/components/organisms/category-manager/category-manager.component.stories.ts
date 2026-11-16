import type { Meta, StoryObj } from '@storybook/angular-vite';
import { CategoryManagerComponent } from './category-manager.component';
import type { ManagedCategory } from '../../../../core/author/author.service';

const meta: Meta<CategoryManagerComponent> = {
  title: 'Design System/Organisms/CategoryManager',
  component: CategoryManagerComponent,
};
export default meta;

type Story = StoryObj<CategoryManagerComponent>;

const categories: ManagedCategory[] = [
  { id: 4, name: 'Accesibilidad', slug: 'accesibilidad', postCount: 1 },
  { id: 5, name: 'Arquitectura', slug: 'arquitectura', postCount: 0 },
  { id: 3, name: 'Seguridad', slug: 'seguridad', postCount: 1 },
  { id: 1, name: 'Sin clasificar', slug: 'sin-clasificar', postCount: 2 },
];

export const Exito: Story = {
  args: { state: 'ready', categories },
};

export const SinCategorias: Story = {
  args: { state: 'ready', categories: [] },
};

export const Cargando: Story = {
  args: { state: 'loading', categories: null },
};

export const ConError: Story = {
  args: { state: 'error', categories: null },
};

/** Respuesta 409 del backend al crear un nombre repetido. */
export const NombreRepetido: Story = {
  args: { state: 'ready', categories, errorMessage: 'Ya existe la categoría "Seguridad".' },
};

export const Guardando: Story = {
  args: { state: 'ready', categories, busy: true },
};

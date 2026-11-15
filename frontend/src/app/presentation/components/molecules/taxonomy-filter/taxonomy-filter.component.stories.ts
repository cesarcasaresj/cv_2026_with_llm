import type { Meta, StoryObj } from '@storybook/angular-vite';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { TaxonomyFilterComponent } from './taxonomy-filter.component';
import { mockBackend } from '../../../storybook/mock-backend';

const meta: Meta<TaxonomyFilterComponent> = {
  title: 'Design System/Molecules/TaxonomyFilter',
  component: TaxonomyFilterComponent,
  args: { heading: 'Categorías', endpoint: '/api/v1/categories', queryParam: 'categoria', selectedSlug: null },
};
export default meta;

type Story = StoryObj<TaxonomyFilterComponent>;

const terms = [
  { id: 1, name: 'Arquitectura', slug: 'arquitectura', postCount: 3 },
  { id: 2, name: 'Seguridad', slug: 'seguridad', postCount: 1 },
];

export const Exito: Story = {
  decorators: [mockBackend(() => of(new HttpResponse({ status: 200, body: terms })))],
};

export const ConSeleccion: Story = {
  args: { selectedSlug: 'seguridad' },
  decorators: [mockBackend(() => of(new HttpResponse({ status: 200, body: terms })))],
};

export const Cargando: Story = {
  decorators: [mockBackend(() => NEVER)], // La petición nunca termina
};

export const ConError: Story = {
  decorators: [mockBackend(() => throwError(() => new HttpErrorResponse({ status: 500 })))],
};

export const Vacio: Story = {
  args: { heading: 'Etiquetas', endpoint: '/api/v1/tags', queryParam: 'etiqueta' },
  decorators: [mockBackend(() => of(new HttpResponse({ status: 200, body: [] })))],
};

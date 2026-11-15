import type { Meta, StoryObj } from '@storybook/angular-vite';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { PostCounterComponent } from './post-counter.component';
import { mockBackend } from '../../../storybook/mock-backend';

const meta: Meta<PostCounterComponent> = {
  title: 'Design System/Molecules/PostCounter',
  component: PostCounterComponent,
};
export default meta;

type Story = StoryObj<PostCounterComponent>;

export const Exito: Story = {
  decorators: [
    mockBackend(() =>
      of(new HttpResponse({ status: 200, body: { total: 42, lastUpdated: '2026-11-01T10:00:00Z' } })),
    ),
  ],
};

export const Cargando: Story = {
  decorators: [mockBackend(() => NEVER)], // La petición nunca termina
};

export const ConError: Story = {
  decorators: [mockBackend(() => throwError(() => new HttpErrorResponse({ status: 500 })))],
};

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SessionInfoComponent } from './session-info.component';

const meta: Meta<SessionInfoComponent> = {
  title: 'Design System/Molecules/SessionInfo',
  component: SessionInfoComponent,
};
export default meta;

type Story = StoryObj<SessionInfoComponent>;

export const Exito: Story = {
  args: { user: { id: 1, email: 'autor@ejemplo.com' }, pending: false, errorMessage: null },
};

export const Cargando: Story = {
  args: { user: { id: 1, email: 'autor@ejemplo.com' }, pending: true, errorMessage: null },
};

export const ConError: Story = {
  args: {
    user: { id: 1, email: 'autor@ejemplo.com' },
    pending: false,
    errorMessage: 'No pudimos cerrar la sesión. Intenta de nuevo en unos minutos.',
  },
};

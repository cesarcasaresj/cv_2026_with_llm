import type { Meta, StoryObj } from '@storybook/angular-vite';
import { LoginFormComponent } from './login-form.component';

const meta: Meta<LoginFormComponent> = {
  title: 'Design System/Molecules/LoginForm',
  component: LoginFormComponent,
};
export default meta;

type Story = StoryObj<LoginFormComponent>;

export const Exito: Story = {
  args: { pending: false, errorMessage: null },
};

export const Cargando: Story = {
  args: { pending: true, errorMessage: null },
};

export const ConError: Story = {
  args: { pending: false, errorMessage: 'Correo o contraseña incorrectos.' },
};

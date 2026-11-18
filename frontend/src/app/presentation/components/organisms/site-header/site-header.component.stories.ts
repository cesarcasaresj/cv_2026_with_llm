import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SiteHeaderComponent } from './site-header.component';

const meta: Meta<SiteHeaderComponent> = {
  title: 'Design System/Organisms/SiteHeader',
  component: SiteHeaderComponent,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<SiteHeaderComponent>;

/** No depende de datos: solo tiene el estado por defecto. Prueba también con el visor en móvil. */
export const Exito: Story = {};

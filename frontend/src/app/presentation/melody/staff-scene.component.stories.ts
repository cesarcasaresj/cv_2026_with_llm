import type { Meta, StoryObj } from '@storybook/angular-vite';
import { StaffSceneComponent } from './staff-scene.component';

/**
 * Pentagrama de luz de la portada (HU-19): lienzo decorativo que ocupa todo su contenedor.
 * Se dibuja en el navegador tras el primer render; con "reducir movimiento" queda quieto.
 */
const meta: Meta<StaffSceneComponent> = {
  title: 'Design System/Melody/StaffScene',
  component: StaffSceneComponent,
  parameters: { layout: 'fullscreen' },
  render: () => ({
    template: `<div style="position: relative; height: 28rem; background: var(--color-night)"><app-staff-scene /></div>`,
  }),
};
export default meta;

type Story = StoryObj<StaffSceneComponent>;

export const Portada: Story = {};

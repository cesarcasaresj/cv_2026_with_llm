import type { Meta, StoryObj } from '@storybook/angular-vite';
import { AssistantOrbComponent } from './assistant-orb.component';

/**
 * Esfera de energía del botón "Pregúntale a mi CV" (HU-24). Decorativa (aria-hidden).
 * Empieza con la versión CSS y, cuando el navegador queda libre, pasa a la esfera WebGL de three.js
 * (necesita WebGL; con "reducir movimiento" se queda la versión CSS).
 */
const meta: Meta<AssistantOrbComponent> = {
  title: 'Design System/Atoms/AssistantOrb',
  component: AssistantOrbComponent,
  args: { excited: false },
  render: (args) => ({
    props: args,
    template: `<div style="display: grid; place-items: center; padding: 2rem; background: #0b1020">
      <app-assistant-orb [excited]="excited" style="--orb-size: 10rem" />
    </div>`,
  }),
};
export default meta;

type Story = StoryObj<AssistantOrbComponent>;

export const EnReposo: Story = {};

/** Como con el cursor o el foco en el botón: late más fuerte, gira más rápido y crece. */
export const Activa: Story = { args: { excited: true } };

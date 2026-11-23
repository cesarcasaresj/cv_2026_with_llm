import type { Meta, StoryObj } from '@storybook/angular-vite';
import { PlayerCardComponent } from './player-card.component';

/**
 * Tarjeta de personaje de "Acerca de mí" (HU-23): capas de papel que se inclinan con el ratón.
 * Pasa el puntero por encima para ver el paralaje; sola, se balancea de lado a lado.
 */
const meta: Meta<PlayerCardComponent> = {
  title: 'Design System/Molecules/PlayerCard',
  component: PlayerCardComponent,
  render: (args) => ({
    props: args,
    template: `<div style="padding: 3rem 1rem; max-width: 26rem">
      <app-player-card [name]="name" [role]="role" [level]="level" [levelLabel]="levelLabel" [alt]="alt" [image]="image" />
    </div>`,
  }),
  args: {
    name: 'Persona de Ejemplo',
    role: 'Arquitecta de software',
    levelLabel: 'NIV',
    alt: 'Retrato de Persona de Ejemplo',
    image: '/images/perfil/cesar',
  },
};
export default meta;

type Story = StoryObj<PlayerCardComponent>;

export const ConNivel: Story = { args: { level: 10 } };

export const SinNivel: Story = { args: { level: null } };

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { LevelDioramaComponent } from './level-diorama.component';

/**
 * Cajita 3D de un nivel (HU-20). Sin datos del backend: sus estados son la escena y si está abierta o cerrada.
 * Se ve desde el mismo ángulo que en el viaje de la experiencia.
 */
const meta: Meta<LevelDioramaComponent> = {
  title: 'Design System/Atoms/LevelDiorama',
  component: LevelDioramaComponent,
  args: { scene: 'tower', level: 1, year: '2025', open: true },
  argTypes: {
    scene: {
      control: 'select',
      options: ['tower', 'vanity', 'exchange', 'lab', 'antenna', 'billboard', 'phone', 'payment', 'desk'],
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="height: 420px; background: #121417; perspective: 1400px; perspective-origin: 50% 20%; overflow: hidden; position: relative">
        <div style="position: absolute; left: 50%; top: 40%; transform-style: preserve-3d; transform: rotateX(58deg) rotateZ(45deg) translate(-75px, -75px)">
          <app-level-diorama [scene]="scene" [level]="level" [year]="year" [open]="open" />
        </div>
      </div>`,
  }),
};
export default meta;

type Story = StoryObj<LevelDioramaComponent>;

export const Abierta: Story = {};

export const Cerrada: Story = { args: { open: false } };

export const Cambio: Story = { args: { scene: 'exchange', level: 3, year: '2022' } };

export const Antena: Story = { args: { scene: 'antenna', level: 5, year: '2020' } };

export const Generica: Story = { args: { scene: null, level: 9, year: '2015' } };

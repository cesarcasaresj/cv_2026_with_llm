import type { Meta, StoryObj } from '@storybook/angular-vite';
import { NotePadComponent } from './note-pad.component';

/**
 * Teclado de la nana de las ideas (HU-19). No carga datos del backend: sus estados son el avance en la
 * melodía, la pista, el sonido y el modo fiesta. Se muestra sobre el fondo nocturno de la portada.
 */
const meta: Meta<NotePadComponent> = {
  title: 'Design System/Molecules/NotePad',
  component: NotePadComponent,
  args: { soundOn: false, party: false, progress: 0, showStart: false },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 6 } },
    played: { action: 'played' },
    soundChange: { action: 'soundChange' },
    partyEnded: { action: 'partyEnded' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding: 2rem; background: #0b1020">
        <app-note-pad [soundOn]="soundOn" [party]="party" [progress]="progress" [showStart]="showStart"
          (played)="played($event)" (soundChange)="soundChange($event)" (partyEnded)="partyEnded()" />
      </div>`,
  }),
};
export default meta;

type Story = StoryObj<NotePadComponent>;

export const AlEntrar: Story = {};

export const ConAvance: Story = { args: { progress: 4, soundOn: true } };

export const ConPista: Story = { args: { progress: 1, showStart: true } };

export const ModoFiesta: Story = { args: { party: true, soundOn: true, progress: 6 } };

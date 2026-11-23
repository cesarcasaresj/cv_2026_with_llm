import type { Meta, StoryObj } from '@storybook/angular-vite';
import { DialogueBoxComponent } from './dialogue-box.component';

/**
 * Caja de diálogo de "Acerca de mí" (HU-23): el texto se escribe letra a letra; ▼ pasa al siguiente párrafo.
 * Con "reducir movimiento" el párrafo aparece completo.
 */
const meta: Meta<DialogueBoxComponent> = {
  title: 'Design System/Molecules/DialogueBox',
  component: DialogueBoxComponent,
  render: (args) => ({
    props: args,
    template: `<div style="padding: 2.5rem 1rem; max-width: 40rem">
      <app-dialogue-box [speaker]="speaker" [paragraphs]="paragraphs" [portrait]="portrait"
        [nextLabel]="nextLabel" [restartLabel]="restartLabel" />
    </div>`,
  }),
  args: {
    speaker: 'Persona',
    portrait: '/images/perfil/cesar-400.webp',
    nextLabel: 'Siguiente',
    restartLabel: 'Volver a empezar',
  },
};
export default meta;

type Story = StoryObj<DialogueBoxComponent>;

export const VariosParrafos: Story = {
  args: {
    paragraphs: [
      'Construyo interfaces accesibles y rápidas con Angular desde hace años.',
      'Me inspiran la música y el arte: cada proyecto tiene su propio ritmo.',
      'Fuera del trabajo, aprendo algo nuevo cada semana.',
    ],
  },
};

export const UnParrafo: Story = {
  args: { paragraphs: ['Un solo párrafo: no hay botón para avanzar.'] },
};

export const SinRetrato: Story = {
  args: { portrait: null, paragraphs: ['Diálogo sin miniatura de quien habla.', 'Segundo párrafo.'] },
};

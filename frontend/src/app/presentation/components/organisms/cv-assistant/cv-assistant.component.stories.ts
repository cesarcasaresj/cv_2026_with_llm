import type { Meta, StoryObj } from '@storybook/angular-vite';
import { CvAssistantComponent } from './cv-assistant.component';

/**
 * "Pregúntale a mi CV" (HU-24): botón flotante y panel de chat. Presentacional: la conversación llega por
 * inputs y las preguntas salen por (asked). En la portada, el contenedor llama al backend (Claude).
 */
const meta: Meta<CvAssistantComponent> = {
  title: 'Design System/Organisms/CvAssistant',
  component: CvAssistantComponent,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    openChange: { action: 'openChange' },
    asked: { action: 'asked' },
    restarted: { action: 'restarted' },
  },
  args: { name: 'Persona', open: true, messages: [], pending: false, error: null, remaining: 6 },
  render: (args) => ({
    props: args,
    template: `<div style="min-height: 44rem; background: var(--color-surface-soft)">
      <app-cv-assistant [name]="name" [open]="open" [messages]="messages" [pending]="pending" [error]="error"
        [remaining]="remaining" (openChange)="openChange($event)" (asked)="asked($event)" (restarted)="restarted()" />
    </div>`,
  }),
};
export default meta;

type Story = StoryObj<CvAssistantComponent>;

export const Cerrado: Story = { args: { open: false } };

export const AbiertoSinPreguntas: Story = {};

export const Conversacion: Story = {
  args: {
    remaining: 5,
    messages: [
      { role: 'user', content: '¿Qué hace en el banco?' },
      {
        role: 'assistant',
        content: 'Desarrolla la capa de seguridad de la app: verifica token, biometría y dispositivo antes de cada operación sensible.',
      },
    ],
  },
};

export const Escribiendo: Story = {
  args: { pending: true, remaining: 5, messages: [{ role: 'user', content: '¿Con qué tecnologías trabaja?' }] },
};

export const ConError: Story = {
  args: { error: 'El asistente no puede responder ahora. Intenta de nuevo en unos minutos.' },
};

export const SinPreguntasRestantes: Story = {
  args: {
    remaining: 0,
    messages: [
      { role: 'user', content: '¿Dónde vive?' },
      { role: 'assistant', content: 'En Lima, Perú.' },
    ],
  },
};

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SectionHeadingComponent } from './section-heading.component';

/** Encabezado de sección de la portada: número decorativo (oculto al lector de pantalla), título h2 y entradilla. */
const meta: Meta<SectionHeadingComponent> = {
  title: 'Design System/Atoms/SectionHeading',
  component: SectionHeadingComponent,
  args: { index: '02', title: 'Acerca de mí', headingId: 'story-heading', intro: null, onNight: false },
};
export default meta;

type Story = StoryObj<SectionHeadingComponent>;

export const Basico: Story = {};

export const ConEntradilla: Story = {
  args: { index: '03', title: 'Proyectos', intro: 'Lo que he construido, directo desde GitHub.' },
};

export const SobreFondoNoche: Story = {
  args: { index: '01', title: 'Experiencia', onNight: true },
  render: (args) => ({
    props: args,
    template: `<div style="padding: 2rem; background: var(--color-night)">
      <app-section-heading [index]="index" [title]="title" [headingId]="headingId" [intro]="intro" [onNight]="onNight" />
    </div>`,
  }),
};

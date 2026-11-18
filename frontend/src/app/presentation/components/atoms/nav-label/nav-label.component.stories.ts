import type { Meta, StoryObj } from '@storybook/angular-vite';
import { NavLabelComponent } from './nav-label.component';

/**
 * Texto animado de los enlaces del menú (HU-21). No carga datos: sus estados son la sección y si el efecto
 * se está reproduciendo. Cambia `run` en los controles para repetir el efecto.
 */
const meta: Meta<NavLabelComponent> = {
  title: 'Design System/Atoms/NavLabel',
  component: NavLabelComponent,
  args: { run: 1 },
  argTypes: {
    section: { control: 'select', options: ['experience', 'about', 'projects', 'updates', 'blog'] },
    run: { control: { type: 'number', min: 0 } },
  },
  render: (args) => ({
    props: args,
    template: `<p style="padding: 2.5rem 2rem 1rem; font-weight: 600"><app-nav-label [text]="text" [section]="section" [run]="run" /></p>`,
  }),
};
export default meta;

type Story = StoryObj<NavLabelComponent>;

export const Quieto: Story = { args: { text: 'Experiencia', section: 'experience', run: 0 } };

export const Experiencia: Story = { args: { text: 'Experiencia', section: 'experience' } };

export const SobreMi: Story = { args: { text: 'Sobre mí', section: 'about' } };

export const Proyectos: Story = { args: { text: 'Proyectos', section: 'projects' } };

export const Actualidad: Story = { args: { text: 'Actualidad', section: 'updates' } };

export const Blog: Story = { args: { text: 'Blog', section: 'blog' } };

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { NavPreviewComponent } from './nav-preview.component';

/**
 * Escena que aparece al pasar el ratón por un enlace del menú (HU-21). No carga datos: su estado es la sección.
 * En la aplicación se posiciona bajo el enlace; aquí se muestra dentro de un contenedor para verla entera.
 */
const meta: Meta<NavPreviewComponent> = {
  title: 'Design System/Atoms/NavPreview',
  component: NavPreviewComponent,
  argTypes: {
    section: { control: 'select', options: ['experience', 'about', 'projects', 'updates', 'blog'] },
  },
  render: (args) => ({
    props: args,
    template: `<div style="position: relative; height: 170px; width: 260px"><app-nav-preview [section]="section" style="top: 20px" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<NavPreviewComponent>;

export const Experiencia: Story = { args: { section: 'experience' } };

export const SobreMi: Story = { args: { section: 'about' } };

export const Proyectos: Story = { args: { section: 'projects' } };

export const Actualidad: Story = { args: { section: 'updates' } };

export const Blog: Story = { args: { section: 'blog' } };

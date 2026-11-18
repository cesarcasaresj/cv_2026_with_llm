import type { Meta, StoryObj } from '@storybook/angular-vite';
import { ProjectGridComponent } from './project-grid.component';
import { projectsFixture } from '../../../storybook/portfolio-fixtures';

const meta: Meta<ProjectGridComponent> = {
  title: 'Design System/Organisms/ProjectGrid',
  component: ProjectGridComponent,
};
export default meta;

type Story = StoryObj<ProjectGridComponent>;

export const Exito: Story = {
  args: { state: 'ready', projects: projectsFixture, githubUrl: 'https://github.com/ejemplo' },
};

export const SinProyectos: Story = {
  args: { state: 'ready', projects: [], githubUrl: null },
};

export const Cargando: Story = {
  args: { state: 'loading', projects: null },
};

/** GitHub no responde (503): se ofrece el enlace al perfil. */
export const ConError: Story = {
  args: { state: 'error', projects: null, githubUrl: 'https://github.com/ejemplo' },
};

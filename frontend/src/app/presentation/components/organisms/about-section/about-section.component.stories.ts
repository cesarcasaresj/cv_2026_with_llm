import type { Meta, StoryObj } from '@storybook/angular-vite';
import { AboutSectionComponent } from './about-section.component';
import { profileFixture } from '../../../storybook/portfolio-fixtures';

const meta: Meta<AboutSectionComponent> = {
  title: 'Design System/Organisms/AboutSection',
  component: AboutSectionComponent,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<AboutSectionComponent>;

export const Exito: Story = {
  args: { state: 'ready', profile: profileFixture, projectCount: 9 },
};

export const Cargando: Story = {
  args: { state: 'loading', profile: null },
};

export const ConError: Story = {
  args: { state: 'error', profile: null },
};

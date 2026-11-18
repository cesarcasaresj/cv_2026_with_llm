import type { Meta, StoryObj } from '@storybook/angular-vite';
import { UpdateFeedComponent } from './update-feed.component';
import { updatesFixture } from '../../../storybook/portfolio-fixtures';

const meta: Meta<UpdateFeedComponent> = {
  title: 'Design System/Organisms/UpdateFeed',
  component: UpdateFeedComponent,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<UpdateFeedComponent>;

export const Exito: Story = {
  args: { state: 'ready', updates: updatesFixture, linkedinUrl: 'https://www.linkedin.com/in/ejemplo' },
};

export const SinPublicaciones: Story = {
  args: { state: 'ready', updates: [], linkedinUrl: null },
};

export const Cargando: Story = {
  args: { state: 'loading', updates: null },
};

export const ConError: Story = {
  args: { state: 'error', updates: null },
};

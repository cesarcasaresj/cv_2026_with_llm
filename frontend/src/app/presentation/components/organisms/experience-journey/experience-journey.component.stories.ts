import type { Meta, StoryObj } from '@storybook/angular-vite';
import { ExperienceJourneyComponent } from './experience-journey.component';
import { profileFixture } from '../../../storybook/portfolio-fixtures';

/** El viaje de la experiencia (HU-20): un nivel con cajita 3D por puesto. Avanza con el scroll o con ◀ ▶. */
const meta: Meta<ExperienceJourneyComponent> = {
  title: 'Design System/Organisms/ExperienceJourney',
  component: ExperienceJourneyComponent,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<ExperienceJourneyComponent>;

export const Exito: Story = {
  args: { state: 'ready', positions: profileFixture.experience },
};

export const SinExperiencia: Story = {
  args: { state: 'ready', positions: [] },
};

export const Cargando: Story = {
  args: { state: 'loading', positions: null },
};

export const ConError: Story = {
  args: { state: 'error', positions: null },
};

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { HeroSectionComponent } from './hero-section.component';
import { profileFixture } from '../../../storybook/portfolio-fixtures';

const meta: Meta<HeroSectionComponent> = {
  title: 'Design System/Organisms/HeroSection',
  component: HeroSectionComponent,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<HeroSectionComponent>;

/** Con el pentagrama de luz animado (canvas). Toca las notas: la melodía secreta activa el modo fiesta. */
export const Exito: Story = {
  args: { state: 'ready', profile: profileFixture, scene: true },
};

/** Sin el lienzo animado: el degradado CSS de fondo, con las notas igualmente disponibles. */
export const SinLienzo: Story = {
  args: { state: 'ready', profile: profileFixture, scene: false },
};

export const SinEnlaces: Story = {
  args: { state: 'ready', profile: { ...profileFixture, location: null, links: { github: null, linkedin: null } }, scene: false },
};

export const Cargando: Story = {
  args: { state: 'loading', profile: null, scene: false },
};

export const ConError: Story = {
  args: { state: 'error', profile: null, scene: false },
};

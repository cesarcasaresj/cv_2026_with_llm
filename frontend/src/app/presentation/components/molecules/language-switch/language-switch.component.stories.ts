import type { Meta, StoryObj } from '@storybook/angular-vite';
import { LanguageSwitchComponent } from './language-switch.component';

/**
 * Selector de idioma (HU-18). No carga datos: sus estados son el idioma activo y el fondo.
 * Los textos accesibles siguen el idioma de la barra de herramientas de Storybook.
 */
const meta: Meta<LanguageSwitchComponent> = {
  title: 'Design System/Molecules/LanguageSwitch',
  component: LanguageSwitchComponent,
  args: { lang: 'es', onNight: false },
  argTypes: {
    lang: { control: 'inline-radio', options: ['es', 'en'] },
    selected: { action: 'selected' },
  },
};
export default meta;

type Story = StoryObj<LanguageSwitchComponent>;

export const Espanol: Story = {};

export const Ingles: Story = { args: { lang: 'en' } };

export const SobreFondoOscuro: Story = {
  args: { onNight: true },
  parameters: { backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#121417' }] } },
};

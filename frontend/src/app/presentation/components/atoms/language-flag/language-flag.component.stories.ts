import type { Meta, StoryObj } from '@storybook/angular-vite';
import { LanguageFlagComponent } from './language-flag.component';

/**
 * Bandera cartoon del cambio de idioma (HU-21). No carga datos: sus estados son el idioma.
 * La animación dura ~1,5 s; cambia `run` en los controles para repetirla.
 */
const meta: Meta<LanguageFlagComponent> = {
  title: 'Design System/Atoms/LanguageFlag',
  component: LanguageFlagComponent,
  parameters: { layout: 'fullscreen' },
  args: { lang: 'en', run: 1 },
  argTypes: {
    lang: { control: 'inline-radio', options: ['es', 'en'] },
    run: { control: { type: 'number', min: 0 } },
  },
  render: (args) => ({
    props: args,
    template: `<div style="height: 420px; background: #121417"><app-language-flag [lang]="lang" [run]="run" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<LanguageFlagComponent>;

export const Ingles: Story = {};

export const Espanol: Story = { args: { lang: 'es' } };

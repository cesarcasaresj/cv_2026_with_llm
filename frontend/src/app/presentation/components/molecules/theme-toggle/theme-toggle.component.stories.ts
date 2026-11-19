import type { Meta, StoryObj } from '@storybook/angular-vite';
import { ThemeToggleComponent } from './theme-toggle.component';

/**
 * Interruptor de modo claro / oscuro (HU-22). El dibujo lo decide la variable global --is-dark:
 * en estas historias se fija en un contenedor para ver los dos estados uno junto al otro.
 */
const meta: Meta<ThemeToggleComponent> = {
  title: 'Design System/Molecules/ThemeToggle',
  component: ThemeToggleComponent,
  argTypes: { toggled: { action: 'toggled' } },
  render: (args) => ({
    props: args,
    template: `<div [style.--is-dark]="dark ? 1 : 0" [style.color-scheme]="dark ? 'dark' : 'light'"
      [style.background]="dark ? '#0f1426' : '#fff'" style="display: inline-block; padding: 1rem; border-radius: 1rem">
      <app-theme-toggle [dark]="dark" (toggled)="toggled($event)" />
    </div>`,
  }),
};
export default meta;

type Story = StoryObj<ThemeToggleComponent>;

export const Claro: Story = { args: { dark: false } };

export const Oscuro: Story = { args: { dark: true } };

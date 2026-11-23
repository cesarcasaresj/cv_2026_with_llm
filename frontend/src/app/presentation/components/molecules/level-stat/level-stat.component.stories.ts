import type { Meta, StoryObj } from '@storybook/angular-vite';
import { LevelStatComponent } from './level-stat.component';

/**
 * Logro de "Acerca de mí" (HU-23): la cifra cuenta, se llena la barra y salta "LEVEL UP!".
 * Recarga la historia para repetir la animación.
 */
const meta: Meta<LevelStatComponent> = {
  title: 'Design System/Molecules/LevelStat',
  component: LevelStatComponent,
  render: (args) => ({
    props: args,
    template: `<div style="padding: 2rem 1rem; max-width: 18rem">
      <app-level-stat [value]="value" [suffix]="suffix" [label]="label" [achievement]="achievement"
        [badge]="badge" [variant]="variant" [href]="href" [linkLabel]="linkLabel" />
    </div>`,
  }),
  args: { badge: 'LEVEL UP!', variant: 'level', suffix: '', href: null, linkLabel: null },
};
export default meta;

type Story = StoryObj<LevelStatComponent>;

export const Anios: Story = {
  args: { value: 10, suffix: '+', label: 'años de experiencia', achievement: 'Nivel 10 alcanzado' },
};

export const Empresas: Story = {
  args: { value: 6, label: 'empresas', achievement: '6.ª empresa desbloqueada' },
};

export const OpenSource: Story = {
  args: {
    value: 9,
    label: 'proyectos públicos',
    achievement: 'Código abierto para todos',
    badge: 'OPEN SOURCE',
    variant: 'open-source',
    href: 'https://github.com/ejemplo',
    linkLabel: 'Ver en GitHub',
  },
};

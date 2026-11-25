import type { Meta, StoryObj } from '@storybook/angular-vite';
import { WeatherSceneComponent } from './weather-scene.component';

/** Escena del clima en 3D (HU-25): una por condición, de día y de noche. Decorativa (aria-hidden). */
const meta: Meta<WeatherSceneComponent> = {
  title: 'Design System/Atoms/WeatherScene',
  component: WeatherSceneComponent,
  args: { size: '6rem', isDay: true },
  argTypes: {
    condition: { control: 'select', options: ['clear', 'partly-cloudy', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'thunder'] },
  },
};
export default meta;

type Story = StoryObj<WeatherSceneComponent>;

export const Despejado: Story = { args: { condition: 'clear' } };
export const DespejadoDeNoche: Story = { args: { condition: 'clear', isDay: false } };
export const ParcialmenteNublado: Story = { args: { condition: 'partly-cloudy' } };
export const Nublado: Story = { args: { condition: 'cloudy' } };
export const Niebla: Story = { args: { condition: 'fog' } };
export const Llovizna: Story = { args: { condition: 'drizzle' } };
export const Lluvia: Story = { args: { condition: 'rain' } };
export const Nieve: Story = { args: { condition: 'snow' } };
export const Tormenta: Story = { args: { condition: 'thunder' } };

/** Todas juntas, para comparar. */
export const Todas: Story = {
  render: () => ({
    props: { conditions: ['clear', 'partly-cloudy', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'thunder'] },
    template: `<div style="display: flex; flex-wrap: wrap; gap: 1.5rem; padding: 1rem">
      @for (condition of conditions; track condition) {
        <figure style="margin: 0; text-align: center">
          <app-weather-scene [condition]="condition" size="5rem" />
          <figcaption>{{ condition }}</figcaption>
        </figure>
      }
    </div>`,
  }),
};

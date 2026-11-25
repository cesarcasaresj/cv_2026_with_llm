import type { Meta, StoryObj } from '@storybook/angular-vite';
import { WeatherWidgetComponent } from './weather-widget.component';

/**
 * Clima del visitante en la cabecera (HU-25): °C en español y °F en inglés (cambia el idioma en la barra).
 * Pulsa el botón para ver el panel con el detalle.
 */
const meta: Meta<WeatherWidgetComponent> = {
  title: 'Design System/Molecules/WeatherWidget',
  component: WeatherWidgetComponent,
  argTypes: { locate: { action: 'locate' } },
  args: { locating: false, locationFailed: false, canLocate: true },
  render: (args) => ({
    props: args,
    template: `<div style="display: flex; justify-content: flex-end; padding: 1rem 1rem 16rem">
      <app-weather-widget [weather]="weather" [locating]="locating" [locationFailed]="locationFailed"
        [canLocate]="canLocate" (locate)="locate()" />
    </div>`,
  }),
};
export default meta;

type Story = StoryObj<WeatherWidgetComponent>;

export const AproximadoPorCiudad: Story = {
  args: { weather: { condition: 'partly-cloudy', temperatureC: 24.6, isDay: true, place: 'Lima', source: 'default' } },
};

export const UbicacionDelNavegador: Story = {
  args: { weather: { condition: 'rain', temperatureC: 11.2, isDay: true, place: null, source: 'browser' } },
};

export const DeNoche: Story = {
  args: { weather: { condition: 'clear', temperatureC: -3, isDay: false, place: 'Madrid', source: 'network' } },
};

export const Ubicando: Story = {
  args: { locating: true, weather: { condition: 'fog', temperatureC: 9, isDay: true, place: 'Lima', source: 'default' } },
};

export const SinPermiso: Story = {
  args: { locationFailed: true, weather: { condition: 'thunder', temperatureC: 28, isDay: true, place: 'Lima', source: 'default' } },
};

import { Component, computed, input } from '@angular/core';
import type { WeatherCondition } from '../../../../core/weather/weather';

/**
 * Escena del clima en capas con profundidad (spec.md, HU-25): sol o luna, nubes delante y detrás, lluvia,
 * llovizna, nieve, niebla o rayos. Se balancea despacio en 3D y se anima según la condición.
 * Es decorativa (aria-hidden): el texto del widget dice el clima. Con "reducir movimiento" queda quieta.
 */
@Component({
  selector: 'app-weather-scene',
  templateUrl: './weather-scene.component.html',
  styleUrl: './weather-scene.component.css',
  host: {
    'aria-hidden': 'true',
    '[class]': '"scene scene--" + condition() + (isDay() ? " scene--day" : " scene--night")',
    '[style.--scene-size]': 'size()',
  },
})
export class WeatherSceneComponent {
  readonly condition = input.required<WeatherCondition>();
  readonly isDay = input(true);
  /** Lado de la escena, con unidad CSS. */
  readonly size = input('2.25rem');

  protected readonly showSky = computed(() => ['clear', 'partly-cloudy'].includes(this.condition()));
  protected readonly clouds = computed(() => (this.condition() === 'clear' ? 0 : this.condition() === 'partly-cloudy' ? 1 : 2));
  protected readonly drops = computed(() => {
    const condition = this.condition();
    if (condition === 'rain' || condition === 'thunder') return [0, 1, 2, 3, 4];
    if (condition === 'drizzle') return [0, 1, 2];
    return [];
  });
  protected readonly flakes = computed(() => (this.condition() === 'snow' ? [0, 1, 2, 3, 4] : []));
  protected readonly fog = computed(() => this.condition() === 'fog');
  protected readonly bolt = computed(() => this.condition() === 'thunder');
}

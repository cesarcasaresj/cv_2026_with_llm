import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatTemperature, type Weather } from '../../../../core/weather/weather';
import { WeatherSceneComponent } from '../../atoms/weather-scene/weather-scene.component';

/**
 * Clima del visitante en la cabecera (spec.md, HU-25): escena 3D animada y temperatura (°C en español, °F en
 * inglés). Al pulsarlo se abre un panel con el detalle y la opción de usar la ubicación exacta (con permiso).
 * Presentacional: recibe el clima y avisa cuando la persona pide usar su ubicación.
 */
@Component({
  imports: [WeatherSceneComponent],
  selector: 'app-weather-widget',
  templateUrl: './weather-widget.component.html',
  styleUrl: './weather-widget.component.css',
  host: {
    // En todo el documento: tras pulsar "Usar mi ubicación" el foco puede salir del panel
    '(document:keydown.escape)': 'close(true)',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class WeatherWidgetComponent {
  private readonly i18n = inject(I18nService);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly t = this.i18n.t;

  readonly weather = input.required<Weather>();
  /** true mientras se pide la ubicación al navegador y el clima de ese punto. */
  readonly locating = input(false);
  /** true si la persona no dio permiso o el navegador no pudo ubicarla. */
  readonly locationFailed = input(false);
  /** false si el navegador no ofrece geolocalización. */
  readonly canLocate = input(true);
  readonly locate = output<void>();

  protected readonly open = signal(false);
  protected readonly temperature = computed(() => formatTemperature(this.weather().temperatureC, this.i18n.lang()));
  protected readonly conditionText = computed(() => this.t().weather.conditions[this.weather().condition]);
  protected readonly placeText = computed(() => {
    const { place, source } = this.weather();
    const text = this.t().weather;
    if (source === 'browser') return text.yourLocation;
    return place ? text.inPlace(place) : text.nearYou;
  });
  /** Nombre accesible del botón: "Clima: 25 °C, parcialmente nublado, en Lima". */
  protected readonly label = computed(() =>
    this.t().weather.label(this.temperature(), this.conditionText(), this.placeText()),
  );

  protected toggle(): void {
    this.open.update((open) => !open);
  }

  protected close(returnFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) this.element.querySelector<HTMLButtonElement>('.weather__button')?.focus();
  }

  /** El botón se desactiva y luego desaparece: el foco pasa al panel para no perderse. */
  protected requestLocation(panel: HTMLElement): void {
    panel.focus();
    this.locate.emit();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.element.contains(event.target as Node)) this.close();
  }
}

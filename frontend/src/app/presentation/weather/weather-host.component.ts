import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WEATHER_API, type Weather } from '../../core/weather/weather';
import { WeatherWidgetComponent } from '../components/molecules/weather-widget/weather-widget.component';

/**
 * Contenedor del clima de la cabecera (spec.md, HU-25). Solo en el navegador: el clima depende de quién visita,
 * así que no va en el HTML del servidor. La ubicación exacta solo se pide si la persona pulsa "Usar mi ubicación".
 */
@Component({
  imports: [WeatherWidgetComponent],
  selector: 'app-weather-host',
  template: `
    @if (weather(); as current) {
      <app-weather-widget
        [weather]="current"
        [locating]="locating()"
        [locationFailed]="locationFailed()"
        [canLocate]="canLocate"
        (locate)="locate()"
      />
    }
  `,
})
export class WeatherHostComponent {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly weather = signal<Weather | null>(null);
  protected readonly locating = signal(false);
  protected readonly locationFailed = signal(false);
  protected readonly canLocate = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  constructor() {
    afterNextRender(() => this.load());
  }

  protected locate(): void {
    if (!this.canLocate || this.locating()) return;
    this.locating.set(true);
    this.locationFailed.set(false);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => this.load(coords.latitude, coords.longitude),
      () => {
        this.locating.set(false);
        this.locationFailed.set(true);
      },
      // Precisión baja: para el clima basta la zona, y el backend redondea igualmente
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30 * 60 * 1000 },
    );
  }

  private load(latitude?: number, longitude?: number): void {
    const params =
      latitude === undefined || longitude === undefined
        ? undefined
        : new HttpParams().set('lat', latitude.toFixed(2)).set('lon', longitude.toFixed(2));
    const subscription = this.http.get<Weather>(WEATHER_API, { params }).subscribe({
      next: (weather) => {
        this.weather.set(weather);
        this.locating.set(false);
      },
      // Sin clima, el widget simplemente no aparece (o se queda el anterior)
      error: () => {
        this.locating.set(false);
        if (latitude !== undefined) this.locationFailed.set(true);
      },
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}

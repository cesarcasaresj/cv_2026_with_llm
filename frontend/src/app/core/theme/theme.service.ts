import { DOCUMENT, DestroyRef, Injectable, PLATFORM_ID, REQUEST, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { I18nService } from '../i18n/i18n.service';
import { type Theme, hourInTimeZone, themeCookie, themeForHour, themeFromCookie } from './theme';

/** Cada cuánto se revisa la hora para pasar a claro u oscuro sin recargar (si la persona no eligió). */
const CLOCK_CHECK_MS = 60_000;

/** Clase que lleva <html> mientras cambia el tema: styles.css dibuja el círculo que se expande. */
const SWITCHING_CLASS = 'is-switching-theme';

/** Punto de la pantalla desde el que se expande el nuevo tema (normalmente, el botón pulsado). */
export interface ThemeOrigin {
  x: number;
  y: number;
}

/**
 * Modo claro / oscuro (spec.md, HU-22 y HU-27), sin librerías. Orden de prioridad:
 * 1. La elección de la persona (botón sol / luna), guardada en la cookie `theme`: siempre manda.
 * 2. La hora local del visitante: claro de día, oscuro de noche. En el servidor, la zona horaria llega de
 *    Cloudflare (cabecera `cf-timezone`), así la página llega ya con su tema; en el navegador, la del dispositivo.
 * 3. Si no se conoce la hora (servidor sin Cloudflare), el sistema (prefers-color-scheme), que resuelve el CSS.
 * - Al elegir, se guarda la cookie `theme` y <html data-theme="dark|light"> fija el tema. El servidor lee
 *   la misma cookie y escribe el atributo en el HTML, así que la página llega ya con su tema.
 * - Los colores viven en styles.css con light-dark(): este servicio solo decide qué esquema manda.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly i18n = inject(I18nService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Tema elegido por la persona; null = automático. */
  private readonly chosen = signal<Theme | null>(this.initialChoice());
  /** Tema según la hora del visitante; null si no se conoce. */
  private readonly byClock = signal<Theme | null>(this.initialClockTheme());
  /** Tema del sistema. En el servidor no se conoce: se supone claro (solo afecta a aria-pressed). */
  private readonly system = signal<Theme>('light');

  /** Tema que se ve ahora. */
  readonly theme = computed<Theme>(() => this.chosen() ?? this.byClock() ?? this.system());

  constructor() {
    this.writeAttribute(this.chosen() ?? this.byClock());
    if (!this.isBrowser) return;

    // Si cae la noche (o amanece) con la página abierta, cambia solo, salvo que la persona haya elegido
    const timer = setInterval(() => {
      const next = themeForHour(new Date().getHours());
      if (next === this.byClock()) return;
      this.byClock.set(next);
      if (!this.chosen()) this.writeAttribute(next);
    }, CLOCK_CHECK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    if (typeof matchMedia !== 'function') return;

    const query = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => this.system.set(query.matches ? 'dark' : 'light');
    sync();
    query.addEventListener('change', sync);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', sync));
  }

  /**
   * Cambia al tema contrario y lo recuerda. Con View Transitions, el nuevo tema se expande en círculo desde
   * `origin` (el botón); con "reducir movimiento", es un fundido. Sin esa API, el cambio es inmediato.
   */
  async toggle(origin?: ThemeOrigin): Promise<void> {
    if (!this.isBrowser) return;
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.document.cookie = themeCookie(next);
    const apply = () => {
      this.chosen.set(next);
      this.writeAttribute(next);
    };

    const root = this.document.documentElement;
    if (typeof this.document.startViewTransition !== 'function') {
      apply();
    } else {
      const view = this.document.defaultView;
      const x = origin?.x ?? (view?.innerWidth ?? 0) / 2;
      const y = origin?.y ?? 0;
      // Radio hasta la esquina más lejana: el círculo termina cubriendo toda la pantalla
      const width = view?.innerWidth ?? 0;
      const height = view?.innerHeight ?? 0;
      const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
      root.style.setProperty('--theme-x', `${x}px`);
      root.style.setProperty('--theme-y', `${y}px`);
      root.style.setProperty('--theme-r', `${radius}px`);
      root.classList.add(SWITCHING_CLASS);
      const transition = this.document.startViewTransition(apply);
      await transition.finished.catch(() => undefined);
      root.classList.remove(SWITCHING_CLASS);
    }

    const messages = this.i18n.t().theme;
    this.announcer.announce(next === 'dark' ? messages.changedToDark : messages.changedToLight, 'polite');
  }

  private writeAttribute(theme: Theme | null): void {
    const root = this.document.documentElement;
    if (theme) root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
  }

  private initialClockTheme(): Theme | null {
    if (this.isBrowser) return themeForHour(new Date().getHours());
    const timeZone = inject(REQUEST, { optional: true })?.headers.get('cf-timezone');
    const hour = hourInTimeZone(timeZone);
    return hour === null ? null : themeForHour(hour);
  }

  private initialChoice(): Theme | null {
    if (this.isBrowser) return themeFromCookie(this.document.cookie);
    return themeFromCookie(inject(REQUEST, { optional: true })?.headers.get('cookie') ?? null);
  }
}

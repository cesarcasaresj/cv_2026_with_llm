import {
  ApplicationRef,
  DOCUMENT,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  REQUEST,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { type Lang, langCookie, negotiateLang } from './lang';
import { es, type Messages } from './messages.es';
import { en } from './messages.en';

const DICTIONARIES: Record<Lang, Messages> = { es, en };

/** Clase que lleva <html> mientras cambia el idioma: styles.css le da su propio fundido. */
const SWITCHING_CLASS = 'is-switching-lang';
/** Lo máximo que se espera a los datos del nuevo idioma antes de mostrar el cambio. */
const MAX_WAIT_MS = 1500;

/**
 * Idioma fijo para entornos sin petición ni navegador real (Storybook, pruebas).
 * La aplicación no lo usa: el idioma sale de la cookie o del navegador.
 */
export const INITIAL_LANG = new InjectionToken<Lang>('INITIAL_LANG');

/**
 * Traducción de la interfaz hecha a mano (spec.md, HU-18), sin librerías:
 * - `lang` es una señal; `t` es el diccionario de ese idioma. Las plantillas leen `i18n.t().hero.askCta`:
 *   con autocompletado, comprobado al compilar y actualizado al instante cuando cambia el idioma.
 * - El primer idioma lo decide la cookie `lang`, si no el idioma del navegador, si no el español.
 *   El servidor y el navegador usan la misma regla, así que el HTML hidratado coincide y no hay parpadeo.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly current = signal<Lang>(this.initialLang());

  /** Idioma activo. Sirve también como locale del pipe date ("es" y "en" están registrados). */
  readonly lang = this.current.asReadonly();
  /** Textos del idioma activo. */
  readonly t = computed(() => DICTIONARIES[this.current()]);

  constructor() {
    // En el servidor queda escrito en el HTML: <html lang="en">
    this.document.documentElement.lang = this.current();
  }

  /**
   * Cambia el idioma sin recargar: guarda la elección, actualiza los textos y lo anuncia.
   * Con View Transitions, el cambio se ve como un fundido suave, y espera (como mucho 1,5 s) a que lleguen
   * los datos del nuevo idioma para que todo cambie a la vez. Sin esa API, el cambio es inmediato.
   */
  async setLang(lang: Lang): Promise<void> {
    if (lang === this.current()) return;

    this.document.cookie = langCookie(lang);
    const apply = () => {
      this.current.set(lang);
      this.document.documentElement.lang = lang;
    };

    const root = this.document.documentElement;
    if (typeof this.document.startViewTransition !== 'function') {
      apply();
    } else {
      root.classList.add(SWITCHING_CLASS);
      const transition = this.document.startViewTransition(async () => {
        apply();
        await this.settled();
      });
      await transition.finished.catch(() => undefined);
      root.classList.remove(SWITCHING_CLASS);
    }

    const messages = this.t().language;
    this.announcer.announce(messages.changed(messages.names[lang]), 'polite');
  }

  /** Se resuelve cuando Angular pintó el cambio y terminaron sus peticiones (o al pasar el tiempo máximo). */
  private settled(): Promise<void> {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, MAX_WAIT_MS));
    return Promise.race([this.appRef.whenStable(), timeout]);
  }

  private initialLang(): Lang {
    const fixed = inject(INITIAL_LANG, { optional: true });
    if (fixed) return fixed;

    if (this.isBrowser) {
      // navigator.languages es de donde el navegador construye Accept-Language: misma respuesta que el servidor
      return negotiateLang(this.document.cookie, navigator.languages.join(','));
    }
    const request = inject(REQUEST, { optional: true });
    return negotiateLang(request?.headers.get('cookie') ?? null, request?.headers.get('accept-language') ?? null);
  }
}

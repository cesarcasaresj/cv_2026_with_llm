import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { prefersReducedMotion } from '../motion/motion';

/** Secciones con portal propio (spec.md, HU-21). */
export type PortalSection = 'experience' | 'about' | 'projects' | 'updates' | 'blog';

export interface PortalRequest {
  section: PortalSection;
  /** Cambia en cada petición: pulsar dos veces la misma sección vuelve a abrir el portal. */
  id: number;
}

/**
 * Portales entre secciones (spec.md, HU-21): al pulsar un enlace del menú, una escena 3D de ~1,5 s cuenta la sección
 * mientras la página navega por debajo. El portal nunca bloquea la navegación: el enlace funciona igual sin él.
 *
 * No se abre con "reducir movimiento", en el servidor, ni con clics que no son una navegación normal
 * (rueda del ratón, Ctrl/Cmd/Mayús: abrir en otra pestaña o ventana).
 */
@Injectable({ providedIn: 'root' })
export class SectionPortalService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private nextId = 0;

  /** Portal que hay que reproducir ahora (null: ninguno). */
  readonly request = signal<PortalRequest | null>(null);
  /** Años de la experiencia, del más antiguo al más reciente, para el túnel del tiempo. */
  readonly years = signal<number[]>([]);

  /** Llamar en el (click) del enlace: si el clic es una navegación normal, abre el portal de esa sección. */
  play(section: PortalSection, event?: MouseEvent): void {
    if (!this.isBrowser || prefersReducedMotion()) return;
    if (event && (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
    this.request.set({ section, id: ++this.nextId });
  }

  close(): void {
    this.request.set(null);
  }
}

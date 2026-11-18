import { Component, DestroyRef, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { prefersReducedMotion } from '../motion/motion';
import type { NoteId } from './melody';
import type { StaffSceneHandle } from './staff-scene';

/**
 * Lienzo decorativo de la portada: el pentagrama de luz (spec.md, HU-19).
 * En el servidor solo se pinta el <canvas> vacío; el dibujo arranca en el navegador después del primer render.
 */
@Component({
  selector: 'app-staff-scene',
  template: '<canvas #canvas class="staff-scene__canvas" [class.staff-scene__canvas--ready]="ready()" aria-hidden="true"></canvas>',
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
    }

    .staff-scene__canvas {
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0;
      transition: opacity 1.4s var(--ease-out);
    }

    .staff-scene__canvas--ready {
      opacity: 1;
    }
  `,
})
export class StaffSceneComponent {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private handle: StaffSceneHandle | null = null;
  private destroyed = false;
  /** El modo fiesta puede pedirse antes de que la escena termine de cargar: se recuerda. */
  private party = false;
  protected readonly ready = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.handle?.dispose();
    });

    afterNextRender(async () => {
      // Carga diferida: el código de la escena no retrasa el primer render
      const { createStaffScene } = await import('./staff-scene');
      if (this.destroyed) return;
      this.handle = createStaffScene(this.canvas().nativeElement, {
        reducedMotion: prefersReducedMotion(),
        compact: window.matchMedia('(max-width: 40rem)').matches,
      });
      this.handle?.setParty(this.party);
      this.ready.set(this.handle !== null);
    });
  }

  play(id: NoteId, inMelody: boolean): void {
    this.handle?.play(id, inMelody);
  }

  setParty(on: boolean): void {
    this.party = on;
    this.handle?.setParty(on);
  }
}

import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { SectionPortalService, type PortalSection } from './section-portal.service';
import type { PortalPlayer } from './portal-scenes';

/**
 * Duración de la escena y del fundido de salida (HU-21). Lo bastante larga para disfrutarla
 * (comentario de quienes la probaron); un clic o Esc la saltan en cualquier momento.
 */
const SCENE_MS = 2600;
const FADE_MS = 600;

/**
 * Capa a pantalla completa que reproduce el portal de una sección (spec.md, HU-21).
 * Es decorativa (aria-hidden): la página ya navegó por debajo y el foco está en la sección de destino.
 * Se salta con un clic o con Esc. three.js se descarga aquí, la primera vez que se abre un portal.
 */
@Component({
  selector: 'app-section-portal',
  templateUrl: './section-portal.component.html',
  styleUrl: './section-portal.component.css',
  host: { '(document:keydown.escape)': 'skip()' },
})
export class SectionPortalComponent {
  private readonly portals = inject(SectionPortalService);
  protected readonly t = inject(I18nService).t;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly open = signal(false);
  protected readonly section = signal<PortalSection | null>(null);
  /** El título grande es el mismo texto del enlace del menú. */
  protected readonly label = computed(() => {
    const section = this.section();
    const header = this.t().header;
    const labels: Record<PortalSection, string> = {
      experience: header.experience,
      about: header.about,
      projects: header.projects,
      updates: header.updates,
      blog: header.blog,
    };
    return section ? labels[section] : '';
  });

  private player: Promise<PortalPlayer | null> | null = null;
  private playing: Promise<void> = Promise.resolve();

  constructor() {
    effect(() => {
      const request = this.portals.request();
      if (request) untracked(() => this.start(request.section));
    });
    inject(DestroyRef).onDestroy(() => void this.player?.then((player) => player?.dispose()));
  }

  protected skip(): void {
    if (this.open()) void this.player?.then((player) => player?.skip());
  }

  private start(section: PortalSection): void {
    // Si ya había un portal en marcha, se salta y el nuevo empieza al terminar
    this.skip();
    this.playing = this.playing.then(() => this.run(section));
  }

  private async run(section: PortalSection): Promise<void> {
    this.section.set(section);
    this.open.set(true);
    const player = await this.loadPlayer();
    if (player) {
      await player.play(section, { years: this.portals.years(), durationMs: SCENE_MS });
    }
    this.open.set(false);
    await new Promise((resolve) => setTimeout(resolve, FADE_MS));
    if (!this.open()) this.portals.close();
  }

  /** three.js y las escenas se descargan una sola vez, al abrir el primer portal. */
  private loadPlayer(): Promise<PortalPlayer | null> {
    this.player ??= import('./portal-scenes')
      .then(({ createPortalPlayer }) => createPortalPlayer(this.canvas().nativeElement))
      .catch(() => null);
    return this.player;
  }
}

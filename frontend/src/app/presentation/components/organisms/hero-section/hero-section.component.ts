import { Component, DOCUMENT, DestroyRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { Profile } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StaffSceneComponent } from '../../../melody/staff-scene.component';
import { NOTES, SECRET_MELODY, melodyProgress, noteById, type NoteId } from '../../../melody/melody';
import { MelodyAudioService } from '../../../melody/melody-audio.service';
import { NotePadComponent } from '../../molecules/note-pad/note-pad.component';

/** Notas que se recuerdan: basta con algo más que la melodía para encontrarla al final. */
const HISTORY_LIMIT = 12;
/** Tras tantas notas sin acertar, la pista enseña cómo empieza la melodía. */
const NOTES_BEFORE_HINT = 10;
/** Clase de <html> que activa la paleta de fiesta en toda la página (styles.css). */
const PARTY_CLASS = 'is-party';

/**
 * Portada (spec.md, HU-14 y HU-19): nombre, titular, llamadas a la acción y "la nana de las ideas":
 * un pentagrama de luz con cinco notas para tocar. Quien toca la melodía secreta activa el modo fiesta.
 * El juego es un extra: nada del contenido depende de él.
 */
@Component({
  imports: [RouterLink, StaffSceneComponent, NotePadComponent],
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css',
})
export class HeroSectionComponent {
  protected readonly t = inject(I18nService).t;
  private readonly announcer = inject(LiveAnnouncer);
  private readonly document = inject(DOCUMENT);
  private readonly audio = inject(MelodyAudioService);

  readonly profile = input<Profile | null>(null);
  readonly state = input.required<ListState>();
  /** false en Storybook: el diseño se compara sin el lienzo animado. */
  readonly scene = input(true);

  private readonly sceneComponent = viewChild(StaffSceneComponent);

  /** Cada palabra del nombre entra por separado (animación escalonada). */
  protected readonly words = computed(() => this.profile()?.name.split(/\s+/).filter(Boolean) ?? []);

  // ---------- La nana de las ideas ----------

  private readonly history = signal<NoteId[]>([]);
  private readonly notesPlayed = signal(0);
  protected readonly progress = computed(() => melodyProgress(this.history()));
  protected readonly showStart = computed(() => this.notesPlayed() >= NOTES_BEFORE_HINT);
  protected readonly party = signal(false);
  /** El interruptor de sonido es de todo el sitio: también suenan los saltos del viaje de la experiencia. */
  protected readonly soundOn = this.audio.soundOn;

  constructor() {
    // La paleta de fiesta afecta a toda la página; se quita al salir de la portada
    effect(() => {
      const on = this.party();
      this.document.documentElement.classList.toggle(PARTY_CLASS, on);
      this.sceneComponent()?.setParty(on);
    });
    inject(DestroyRef).onDestroy(() => {
      this.document.documentElement.classList.remove(PARTY_CLASS);
    });
  }

  protected play(id: NoteId): void {
    const history = [...this.history(), id].slice(-HISTORY_LIMIT);
    const progress = melodyProgress(history);
    const note = noteById(id);

    this.notesPlayed.update((count) => count + 1);
    this.sceneComponent()?.play(id, progress > 0);
    this.audio.play(note.frequency);

    if (progress === SECRET_MELODY.length) {
      // Melodía completa: se empieza de cero para poder volver a encontrarla
      this.history.set([]);
      this.startParty();
    } else {
      this.history.set(history);
      // Cada nota se anuncia por su nombre; si sigue la melodía, también el avance
      const text = this.t().melody;
      const name = text.notes[id];
      this.announcer.announce(progress > 1 ? `${name}. ${text.progress(progress, SECRET_MELODY.length)}` : name, 'polite');
    }
  }

  protected setSound(on: boolean): void {
    this.audio.setSound(on);
  }

  protected endParty(): void {
    this.party.set(false);
    this.announcer.announce(this.t().melody.announceEnded, 'polite');
  }

  private startParty(): void {
    this.party.set(true);
    this.announcer.announce(this.t().melody.announceDiscovered, 'assertive');
    // La melodía de celebración: la nana completa, y después la escala subiendo
    this.audio.arpeggio([...SECRET_MELODY.map((id) => noteById(id).frequency), ...NOTES.map((n) => n.frequency * 2)], 0.16);
  }

}

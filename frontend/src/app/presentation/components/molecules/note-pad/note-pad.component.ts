import { Component, computed, inject, input, output, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NOTES, SECRET_MELODY, noteById, type NoteId } from '../../../melody/melody';

/**
 * Teclado de la nana de las ideas (spec.md, HU-19): cinco notas, el interruptor de sonido y la pista.
 * Es presentacional: avisa de lo que toca la persona y muestra el avance que le llega; no guarda la partida.
 *
 * Teclado: cada nota es un <button> (Tab + Enter o Espacio). Además, con el foco dentro del teclado,
 * las teclas 1 a 5 tocan las notas. No se capturan teclas fuera de él: el resto de la página se usa con normalidad.
 */
@Component({
  selector: 'app-note-pad',
  templateUrl: './note-pad.component.html',
  styleUrl: './note-pad.component.css',
  host: { '(keydown)': 'onKeydown($event)' },
})
export class NotePadComponent {
  protected readonly t = inject(I18nService).t;

  readonly soundOn = input(false);
  readonly party = input(false);
  /** Notas seguidas de la melodía secreta ya tocadas (0 a 6). */
  readonly progress = input(0);
  /** true tras varios intentos: la pista muestra cómo empieza la melodía. */
  readonly showStart = input(false);

  readonly played = output<NoteId>();
  readonly soundChange = output<boolean>();
  readonly partyEnded = output<void>();

  protected readonly notes = NOTES;
  protected readonly steps = SECRET_MELODY.map((_, index) => index);
  /** Nota que acaba de sonar: su botón lanza una onda. El contador hace que se repita en cada pulsación. */
  protected readonly ringing = signal<{ id: NoteId; count: number } | null>(null);

  private readonly startGlyphs = SECRET_MELODY.slice(0, 2)
    .map((id) => noteById(id).glyph)
    .join(' ');

  protected readonly hint = computed(() => {
    const text = this.t().melody;
    return this.showStart() ? text.hintStart(this.startGlyphs) : text.hint;
  });

  protected play(id: NoteId): void {
    this.ringing.update((current) => ({ id, count: (current?.count ?? 0) + 1 }));
    this.played.emit(id);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const note = NOTES[Number(event.key) - 1];
    if (!note) return;
    event.preventDefault();
    this.play(note.id);
  }
}

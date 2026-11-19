import { Component, computed, inject, input, output, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NOTES, SECRET_MELODY, noteById, type NoteId } from '../../../melody/melody';

/**
 * Teclado de la nana de las ideas (spec.md, HU-19): cinco notas, el interruptor de sonido y la pista.
 * Es presentacional: avisa de lo que toca la persona y muestra el avance que le llega; no guarda la partida.
 *
 * Teclado: cada nota es un <button> (Tab + Enter o Espacio). Además, con el foco dentro del teclado,
 * las teclas 1 a 5 tocan las notas, de la fila de números o del teclado numérico (con o sin Bloq Num). No se capturan teclas fuera de él: el resto de la página se usa con normalidad.
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
    const note = NOTES[noteKey(event) - 1];
    if (!note) return;
    // Sin esto, con Bloq Num apagado el navegador haría lo de la tecla: Fin, flechas, Inicio…
    event.preventDefault();
    this.play(note.id);
  }
}

/**
 * Número de nota (1 a 5) de una tecla, o 0 si no es una nota. Se mira la tecla física (`code`), no el carácter:
 * - el teclado numérico vale con Bloq Num encendido o apagado (apagado, su 1 escribe "End" y su 2 "ArrowDown");
 * - la fila de números vale en cualquier distribución (en AZERTY, la tecla del 1 escribe "&").
 * Si el navegador no informa la tecla física (algunos teclados virtuales), se usa el carácter.
 */
export function noteKey(event: Pick<KeyboardEvent, 'code' | 'key'>): number {
  const physical = /^(?:Digit|Numpad)([1-5])$/.exec(event.code);
  if (physical) return Number(physical[1]);
  return /^[1-5]$/.test(event.key) ? Number(event.key) : 0;
}

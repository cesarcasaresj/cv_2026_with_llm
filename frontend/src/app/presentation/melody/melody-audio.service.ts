import { Injectable, signal } from '@angular/core';
import { NOTES } from './melody';
import { Synth } from './synth';

/**
 * Sonido de todo el sitio (spec.md, HU-19 y HU-20). Un solo interruptor: si la persona activa el sonido
 * en la portada, los saltos del viaje de la experiencia también suenan. Apagado por defecto.
 * El sintetizador se crea la primera vez que hace falta (los navegadores exigen un gesto para el audio).
 */
@Injectable({ providedIn: 'root' })
export class MelodyAudioService {
  private readonly on = signal(false);
  private synth: Synth | null = null;

  readonly soundOn = this.on.asReadonly();

  setSound(on: boolean): void {
    this.on.set(on);
    // Al activarlo suena una nota suave: así se sabe que funciona
    if (on) this.play(NOTES[2].frequency);
  }

  /** Toca una nota solo si el sonido está activado. */
  play(frequency: number, delay = 0): void {
    if (this.on()) this.synthesizer().play(frequency, delay);
  }

  arpeggio(frequencies: readonly number[], gap?: number): void {
    if (this.on()) this.synthesizer().arpeggio(frequencies, gap);
  }

  private synthesizer(): Synth {
    return (this.synth ??= new Synth());
  }
}

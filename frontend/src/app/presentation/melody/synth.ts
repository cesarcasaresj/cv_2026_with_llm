// Sonido de las notas con Web Audio, nativo del navegador: sin archivos de audio ni librerías.
// Timbre de flauta suave: una onda senoidal con un poco de vibrato y un armónico "de aire" muy bajo.
// Solo se crea cuando la persona activa el sonido (los navegadores exigen un gesto para reproducir audio).

const VOLUME = 0.16;
const NOTE_SECONDS = 1.4;

export class Synth {
  private context: AudioContext | null = null;

  /** Toca una nota. `delay` en segundos, para encadenar arpegios sin temporizadores. */
  play(frequency: number, delay = 0): void {
    const context = this.ensureContext();
    if (!context) return;

    const start = context.currentTime + delay;
    const end = start + NOTE_SECONDS;

    // Envolvente: entra rápido (como un soplido) y se apaga despacio
    const volume = context.createGain();
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(VOLUME, start + 0.05);
    volume.gain.exponentialRampToValueAtTime(0.0001, end);

    // Filtro paso bajo: quita lo estridente
    const softener = context.createBiquadFilter();
    softener.type = 'lowpass';
    softener.frequency.value = 2600;

    const tone = context.createOscillator();
    tone.type = 'sine';
    tone.frequency.value = frequency;

    // Armónico de "aire" una octava arriba, muy bajo
    const air = context.createOscillator();
    air.type = 'triangle';
    air.frequency.value = frequency * 2;
    const airVolume = context.createGain();
    airVolume.gain.value = 0.08;

    // Vibrato: la afinación oscila ±4 Hz, cinco veces por segundo, y empieza un poco después
    const vibrato = context.createOscillator();
    vibrato.frequency.value = 5;
    const vibratoDepth = context.createGain();
    vibratoDepth.gain.setValueAtTime(0, start);
    vibratoDepth.gain.linearRampToValueAtTime(4, start + 0.35);

    vibrato.connect(vibratoDepth).connect(tone.frequency);
    tone.connect(softener);
    air.connect(airVolume).connect(softener);
    softener.connect(volume).connect(context.destination);

    for (const oscillator of [tone, air, vibrato]) {
      oscillator.start(start);
      oscillator.stop(end);
    }
  }

  /** Varias notas seguidas, separadas `gap` segundos. */
  arpeggio(frequencies: readonly number[], gap = 0.14): void {
    frequencies.forEach((frequency, index) => this.play(frequency, index * gap));
  }

  dispose(): void {
    void this.context?.close();
    this.context = null;
  }

  private ensureContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }
}

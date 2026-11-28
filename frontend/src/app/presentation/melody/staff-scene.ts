// Escena de la portada (spec.md, HU-19): un pentagrama de luz que respira sobre el cielo nocturno.
// Canvas 2D nativo, sin librerías. Es decorativa: el lienzo lleva aria-hidden y todo lo que transmite
// (qué nota sonó, si se descubrió la melodía) también se anuncia con texto.
//
// Qué dibuja, en cada fotograma:
// 1. Cinco líneas que ondulan despacio (más tranquilas a la izquierda, donde está el texto).
// 2. Ondas que recorren una línea cuando suena su nota, y una curva suave donde pasa el puntero.
// 3. Las notas tocadas, que avanzan hacia la izquierda como una partitura y se desvanecen.
// 4. Chispas de color al tocar cada nota.
// 5. En modo fiesta: colores que giran por todo el arcoíris y corcheas ♪ ♫ que suben flotando.
//
// Rendimiento y accesibilidad:
// - Solo anima mientras la portada se ve y la pestaña está activa.
// - Con "reducir movimiento": todo a un cuarto de velocidad, sin curva del puntero ni corcheas que suben.

import { NOTES, noteById, noteColor, type NoteId } from './melody';

export interface StaffSceneHandle {
  /** Dibuja la nota en el pentagrama. `inMelody`: forma parte de la melodía secreta (brilla dorada). */
  play(id: NoteId, inMelody: boolean): void;
  setParty(on: boolean): void;
  dispose(): void;
}

export interface StaffSceneOptions {
  reducedMotion: boolean;
  /** Pantallas pequeñas: menos puntos por línea y menos chispas. */
  compact: boolean;
}

interface Pulse {
  line: number;
  born: number;
}

interface PlayedNote {
  id: NoteId;
  x: number;
  born: number;
  golden: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  color: string;
  size: number;
}

interface FloatingGlyph {
  glyph: string;
  x: number;
  y: number;
  speed: number;
  sway: number;
  hue: number;
  size: number;
}

const LINES = 5;
const NOTE_LIFETIME = 9; // segundos en pantalla
const SCORE_SPEED = 26; // px/s hacia la izquierda
const PULSE_SPEED = 900; // px/s
const GOLD = '#d9a441';

export function createStaffScene(canvas: HTMLCanvasElement, options: StaffSceneOptions): StaffSceneHandle | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  const ctx: CanvasRenderingContext2D = context;

  const timeScale = options.reducedMotion ? 0.25 : 1;
  const step = options.compact ? 14 : 9; // separación entre puntos de cada línea

  let width = 1;
  let height = 1;
  let time = 0;
  let last = performance.now();
  let frame = 0;
  let visible = true;
  let party = false;
  let partyEnergy = 0; // de 0 a 1: la fiesta entra y sale con suavidad
  let nextNoteX = 0;

  const pointer = { x: -9999, y: -9999, energy: 0 };
  const pulses: Pulse[] = [];
  const played: PlayedNote[] = [];
  const particles: Particle[] = [];
  const floating: FloatingGlyph[] = [];

  // ---------- Geometría ----------

  /** Separación entre líneas del pentagrama. */
  function gap(): number {
    return Math.min(Math.max(height * 0.05, 16), 34);
  }

  /** Altura de la línea de abajo; el pentagrama queda en la mitad inferior, bajo el nombre. */
  function bottomLineY(): number {
    return height * 0.72 + gap() * 2;
  }

  /** Altura de la línea `line` (0 abajo, 4 arriba) en la posición x. */
  function lineY(line: number, x: number): number {
    const base = bottomLineY() - line * gap();
    // Más amplitud a la derecha: el texto de la izquierda queda sobre líneas casi quietas
    const calm = 0.25 + 0.75 * (x / width);
    const amplitude = gap() * 0.45 * calm * (1 + partyEnergy * 0.8);
    const breathing =
      Math.sin(x * 0.006 + time * 0.7 + line * 0.55) * 0.65 + Math.sin(x * 0.015 - time * 0.9 + line * 1.1) * 0.35;

    let offset = breathing * amplitude;

    // Ondas de las notas: un bulto que recorre la línea de izquierda a derecha
    for (const pulse of pulses) {
      if (pulse.line !== line) continue;
      const center = (time - pulse.born) * PULSE_SPEED;
      const distance = (x - center) / 70;
      offset -= gap() * 0.9 * Math.exp(-distance * distance);
    }

    // El puntero curva las líneas cercanas, como un dedo sobre cuerdas
    if (pointer.energy > 0.01) {
      const dx = (x - pointer.x) / 110;
      const dy = (base - pointer.y) / 90;
      offset += Math.sign(base - pointer.y || 1) * gap() * 0.8 * pointer.energy * Math.exp(-dx * dx - dy * dy);
    }
    return base + offset;
  }

  // ---------- Dibujo ----------

  /** Dorado de las notas de la melodía secreta: más oscuro en modo claro para que se vea. */
  const gold = () => (light ? '#9a6a00' : GOLD);

  /** true en modo claro. Se lee de --is-dark (styles.css) como mucho dos veces por segundo. */
  let light = false;
  let themeCheckedAt = -Infinity;
  function refreshTheme(): void {
    const now = performance.now();
    if (now - themeCheckedAt < 500) return;
    themeCheckedAt = now;
    light = getComputedStyle(document.documentElement).getPropertyValue('--is-dark').trim() !== '1';
  }

  function lineColor(line: number, alpha: number): string {
    if (partyEnergy > 0.01) {
      const hue = (time * 40 + line * 50) % 360;
      return light ? `hsla(${hue}, 80%, 38%, ${Math.min(alpha * 1.5, 1)})` : `hsla(${hue}, 90%, 70%, ${alpha})`;
    }
    // En claro, azul pizarra y más opaco: sobre gris claro, el lila de la noche no se distingue
    return light ? `rgba(47, 62, 110, ${Math.min(alpha * 1.5, 1)})` : `rgba(196, 204, 255, ${alpha})`;
  }

  function drawStaff(): void {
    for (let line = 0; line < LINES; line++) {
      ctx.beginPath();
      for (let x = -step; x <= width + step; x += step) {
        const y = lineY(line, x);
        if (x === -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Dos pasadas: un halo ancho y tenue, y la línea fina encima
      ctx.strokeStyle = lineColor(line, 0.07 + partyEnergy * 0.08);
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.strokeStyle = lineColor(line, 0.38 + partyEnergy * 0.3);
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  }

  function drawNotes(): void {
    const size = Math.round(gap() * 0.9);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${size}px "Segoe UI Symbol", "Segoe UI", system-ui, sans-serif`;

    for (const note of played) {
      const age = time - note.born;
      const definition = noteById(note.id);
      const y = lineY(definition.line, note.x);
      // Aparece creciendo y se desvanece al final de su vida
      const appear = Math.min(age * 4, 1);
      const alpha = Math.min(1, (NOTE_LIFETIME - age) / 2) * appear;
      const color = note.golden ? gold() : noteColor(note.id, light);
      const spin = partyEnergy > 0.01 ? Math.sin(time * 3 + note.x) * 0.4 * partyEnergy : 0;

      ctx.save();
      ctx.globalAlpha = Math.max(alpha, 0);
      ctx.translate(note.x, y);
      ctx.rotate(spin);
      ctx.scale(0.6 + 0.4 * appear, 0.6 + 0.4 * appear);

      // Aura circular
      const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.3);
      aura.addColorStop(0, `${color}66`);
      aura.addColorStop(1, `${color}00`);
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = color;
      ctx.shadowBlur = note.golden ? 22 : 12;
      ctx.fillStyle = color;
      ctx.fillText(definition.glyph, 0, 0);
      ctx.restore();
    }
  }

  function drawParticles(): void {
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of particles) {
      const progress = (time - particle.born) / particle.life;
      ctx.globalAlpha = Math.max(1 - progress, 0);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1 - progress * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawFloating(): void {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const glyph of floating) {
      ctx.globalAlpha = partyEnergy * 0.85;
      ctx.font = `700 ${glyph.size}px "Segoe UI Symbol", system-ui, sans-serif`;
      ctx.fillStyle = `hsl(${(glyph.hue + time * 60) % 360}, 90%, 72%)`;
      ctx.fillText(glyph.glyph, glyph.x + Math.sin(time * 2 + glyph.sway) * 14, glyph.y);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Movimiento ----------

  function update(delta: number): void {
    time += delta;
    partyEnergy += ((party ? 1 : 0) - partyEnergy) * Math.min(1, delta * 2);
    pointer.energy *= Math.exp(-delta * 1.5);

    // La partitura avanza hacia la izquierda
    for (const note of played) note.x -= SCORE_SPEED * delta;
    nextNoteX -= SCORE_SPEED * delta;
    removeWhere(played, (note) => time - note.born > NOTE_LIFETIME || note.x < -60);
    removeWhere(pulses, (pulse) => (time - pulse.born) * PULSE_SPEED > width + 200);

    for (const particle of particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy -= 20 * delta; // suben un poco, como chispas
      particle.vx *= Math.exp(-delta * 1.2);
    }
    removeWhere(particles, (particle) => time - particle.born > particle.life);

    // Corcheas de la fiesta: nacen abajo y suben
    if (party && !options.reducedMotion && floating.length < (options.compact ? 18 : 36) && Math.random() < delta * 8) {
      floating.push({
        glyph: ['♪', '♫', '♩', '♬', '✦'][Math.floor(Math.random() * 5)],
        x: Math.random() * width,
        y: height + 30,
        speed: 40 + Math.random() * 70,
        sway: Math.random() * 6,
        hue: Math.random() * 360,
        size: 16 + Math.random() * 22,
      });
    }
    for (const glyph of floating) glyph.y -= glyph.speed * delta;
    removeWhere(floating, (glyph) => glyph.y < -40 || (!party && partyEnergy < 0.02));
  }

  function render(): void {
    refreshTheme();
    ctx.clearRect(0, 0, width, height);
    drawStaff();
    drawFloating();
    drawNotes();
    drawParticles();
  }

  function loop(now: number): void {
    const delta = Math.min((now - last) / 1000, 0.05) * timeScale;
    last = now;
    update(delta);
    render();
    frame = requestAnimationFrame(loop);
  }

  function start(): void {
    if (frame || !visible || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(loop);
  }

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function resize(): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  // ---------- Eventos ----------

  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.energy = Math.min(1, pointer.energy + 0.15);
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!frame) render();
  });
  resizeObserver.observe(canvas);

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  });
  intersection.observe(canvas);

  if (!options.reducedMotion) window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  resize();
  start();

  return {
    play(id, inMelody) {
      const definition = noteById(id);
      // Cada nota va a la derecha de la anterior, desde el 70 % del ancho. Si no cabe,
      // la partitura entera se desplaza a la izquierda para hacerle sitio.
      const rightEdge = width - gap() * 1.5;
      const x = Math.max(nextNoteX + gap() * 2.2, width * 0.7);
      if (x > rightEdge) for (const note of played) note.x -= x - rightEdge;
      nextNoteX = Math.min(x, rightEdge);
      played.push({ id, x: nextNoteX, born: time, golden: inMelody });
      pulses.push({ line: definition.line, born: time });

      const y = lineY(definition.line, nextNoteX);
      const count = options.reducedMotion ? 0 : options.compact ? 10 : 18;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 120;
        particles.push({
          x: nextNoteX,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          born: time,
          life: 0.8 + Math.random() * 0.8,
          color: inMelody ? gold() : noteColor(id, light),
          size: 1.2 + Math.random() * 2,
        });
      }
    },
    setParty(on) {
      party = on;
      if (on) {
        // Saludo de la fiesta: una onda por cada línea, de abajo arriba
        NOTES.forEach((note, index) => pulses.push({ line: note.line, born: time + index * 0.08 }));
      }
    },
    dispose() {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

/** Quita de la lista, sin crear otra, los elementos que cumplen la condición. */
function removeWhere<T>(list: T[], condition: (item: T) => boolean): void {
  for (let i = list.length - 1; i >= 0; i--) {
    if (condition(list[i])) list.splice(i, 1);
  }
}

import {
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { Position } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { prefersReducedMotion } from '../../../motion/motion';
import { NOTES } from '../../../melody/melody';
import { MelodyAudioService } from '../../../melody/melody-audio.service';
import { BASE_SIZE } from '../../../journey/scenes';
import { currentYearMonth, duration, monthsBetween, toDate } from '../../../journey/dates';
import { SectionHeadingComponent } from '../../atoms/section-heading/section-heading.component';
import { LevelDioramaComponent } from '../../atoms/level-diorama/level-diorama.component';

/** Separación entre cajas en el tablero (px): el camino avanza en zigzag. */
const STEP_X = 230;
const STEP_Y = 150;
const HALF = BASE_SIZE / 2;

interface Level {
  position: Position;
  number: number;
  /** Esquina de la caja en el tablero. */
  x: number;
  y: number;
  year: string;
  /** Años de experiencia acumulados al empezar este puesto (contados desde el primero). */
  xpYears: number;
}

/**
 * Experiencia como un viaje de videojuego (spec.md, HU-15 y HU-20): cada puesto es un nivel con su cajita 3D,
 * del presente al inicio. La nota ✦ de la portada salta de caja en caja.
 *
 * - El mapa (decorativo, aria-hidden) se queda fijo mientras las tarjetas de texto pasan con el scroll:
 *   la tarjeta que llega al centro de la pantalla activa su nivel. No se captura el scroll.
 * - Los botones ◀ ▶, los números de nivel y las flechas (con el foco en esos botones) llevan a cada tarjeta.
 * - Todo el texto está siempre en la página: lectores de pantalla y buscadores leen la experiencia completa.
 */
@Component({
  imports: [DatePipe, SectionHeadingComponent, LevelDioramaComponent],
  selector: 'app-experience-journey',
  templateUrl: './experience-journey.component.html',
  styleUrl: './experience-journey.component.css',
})
export class ExperienceJourneyComponent {
  private readonly i18n = inject(I18nService);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly audio = inject(MelodyAudioService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly t = this.i18n.t;
  protected readonly lang = this.i18n.lang;
  protected readonly toDate = toDate;
  protected readonly duration = duration;

  readonly positions = input<Position[] | null>(null);
  readonly state = input.required<ListState>();

  /** Nivel activo: 0 es el puesto actual. */
  protected readonly active = signal(0);
  private readonly cards = viewChildren<ElementRef<HTMLElement>>('card');
  private readonly dots = viewChildren<ElementRef<HTMLButtonElement>>('dot');

  protected readonly levels = computed<Level[]>(() => {
    const positions = this.positions() ?? [];
    const oldest = positions.map((p) => p.startedOn).sort()[0];
    return positions.map((position, index) => ({
      position,
      number: index + 1,
      x: index * STEP_X,
      y: (index % 2) * STEP_Y,
      year: position.startedOn.slice(0, 4),
      xpYears: Math.floor(monthsBetween(oldest, position.startedOn) / 12),
    }));
  });

  protected readonly current = computed(() => this.levels()[this.active()] ?? null);

  /** La cámara se centra en la caja activa: el tablero entero se desplaza (CSS transition). */
  protected readonly camera = computed(() => {
    const level = this.current();
    return { '--cam-x': (level?.x ?? 0) + HALF, '--cam-y': (level?.y ?? 0) + HALF };
  });

  protected readonly board = computed(() => {
    const count = this.levels().length;
    return { width: Math.max(count - 1, 0) * STEP_X + BASE_SIZE, height: STEP_Y + BASE_SIZE };
  });

  /** Camino entre los centros de las cajas: curvas suaves que van y vienen en zigzag. */
  protected readonly road = computed(() =>
    this.levels()
      .map(({ x, y }, index, all) => {
        const [cx, cy] = [x + HALF, y + HALF];
        if (index === 0) return `M ${cx} ${cy}`;
        const [px, py] = [all[index - 1].x + HALF, all[index - 1].y + HALF];
        return `C ${px + STEP_X / 2} ${py}, ${cx - STEP_X / 2} ${cy}, ${cx} ${cy}`;
      })
      .join(' '),
  );

  /** Parte del camino ya recorrida (0 a 1). */
  protected readonly travelled = computed(() => {
    const last = this.levels().length - 1;
    return last > 0 ? this.active() / last : 0;
  });

  /** Barra de XP: experiencia acumulada al empezar el nivel, sobre el total hasta hoy. */
  protected readonly xpPercent = computed(() => {
    const levels = this.levels();
    const level = this.current();
    if (!level) return 0;
    const oldest = levels[levels.length - 1].position.startedOn;
    const total = Math.max(monthsBetween(oldest, currentYearMonth()), 1);
    return Math.round((monthsBetween(oldest, level.position.startedOn) / total) * 100);
  });

  constructor() {
    // En el navegador: la tarjeta que cruza el centro de la pantalla activa su nivel
    effect((onCleanup) => {
      const cards = this.cards();
      if (!this.isBrowser || cards.length === 0 || typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) this.active.set(Number((entry.target as HTMLElement).dataset['level']));
          }
        },
        { rootMargin: '-45% 0px -45% 0px' },
      );
      cards.forEach((card) => observer.observe(card.nativeElement));
      onCleanup(() => observer.disconnect());
    });

    // Cada salto suena con una nota de la nana, si el sonido está activado en la portada
    let first = true;
    effect(() => {
      const index = this.active();
      if (first) {
        first = false;
        return;
      }
      untracked(() => this.audio.play(NOTES[NOTES.length - 1 - (index % NOTES.length)].frequency));
    });
  }

  /** Lleva al nivel indicado: mueve la cámara, desplaza la página hasta su tarjeta y lo anuncia. */
  protected go(index: number): void {
    const levels = this.levels();
    const target = Math.min(Math.max(index, 0), levels.length - 1);
    const level = levels[target];
    if (!level) return;

    this.active.set(target);
    this.cards()[target]?.nativeElement.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    const text = this.t().journey;
    this.announcer.announce(text.announce(level.number, levels.length, level.position.title, level.position.company), 'polite');
  }

  /** Con el foco en los controles: flechas para avanzar o retroceder, Inicio y Fin para los extremos. */
  protected onKeydown(event: KeyboardEvent): void {
    const moves: Record<string, number> = {
      ArrowRight: this.active() + 1,
      ArrowLeft: this.active() - 1,
      Home: 0,
      End: this.levels().length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const target = Math.min(Math.max(moves[event.key], 0), this.levels().length - 1);
    this.go(target);
    // El foco sigue al número del nivel activo, para seguir navegando con las flechas
    this.dots()[target]?.nativeElement.focus();
  }
}

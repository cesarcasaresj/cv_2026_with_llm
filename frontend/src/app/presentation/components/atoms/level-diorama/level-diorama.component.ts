import { Component, computed, input } from '@angular/core';
import { BASE_HEIGHT, BASE_SIZE, sceneFor, type LevelScene, type SceneProp } from '../../../journey/scenes';

/** Variables CSS de un cubo: el CSS genérico calcula sus caras a partir de ellas. */
function cubeStyle(prop: SceneProp): Record<string, string | number> {
  return {
    '--x': prop.x,
    '--y': prop.y,
    '--z': prop.z ?? 0,
    '--w': prop.w,
    '--d': prop.d,
    '--h': prop.h,
    '--c': prop.color,
    '--delay': prop.delay ?? 0,
  };
}

/**
 * Cajita 3D de un nivel del viaje de la experiencia (spec.md, HU-20), hecha solo con HTML y CSS 3D.
 * Cerrada muestra el número del nivel en la tapa; abierta (`open`), la tapa gira y la escena surge de dentro.
 * Es decorativa (aria-hidden): la información del puesto está en su tarjeta de texto.
 */
@Component({
  selector: 'app-level-diorama',
  templateUrl: './level-diorama.component.html',
  styleUrl: './level-diorama.component.css',
  host: { 'aria-hidden': 'true' },
})
export class LevelDioramaComponent {
  readonly scene = input<LevelScene | null>(null);
  readonly level = input.required<number>();
  /** Año que se ve en el frente de la base. */
  readonly year = input('');
  readonly open = input(false);

  protected readonly definition = computed(() => sceneFor(this.scene()));
  protected readonly props = computed(() =>
    this.definition().props.map((prop) => ({ prop, style: cubeStyle(prop) })),
  );
  protected readonly baseStyle = {
    '--x': 0,
    '--y': 0,
    '--z': 0,
    '--w': BASE_SIZE,
    '--d': BASE_SIZE,
    '--h': BASE_HEIGHT,
    '--c': '#1e2747',
  };
}

// Dioramas del viaje de la experiencia (spec.md, HU-20).
// Cada escena es una lista de cubos sobre una base de 150 × 150 px: posición (x, y desde la esquina del fondo,
// z hacia arriba), tamaño (ancho w, fondo d, alto h), color y, si se mueve, una animación.
// Un solo CSS genérico (level-diorama.component.css) dibuja cualquier cubo: añadir una escena es añadir datos.

import type { components } from '../../core/api/generated';

export type LevelScene = components['schemas']['LevelScene'];

/** Movimientos disponibles; con "reducir movimiento" ninguno se reproduce. */
export type PropAnimation = 'windows' | 'bob' | 'spin' | 'spin-back' | 'pulse' | 'grow' | 'ripple' | 'slide';

export interface SceneProp {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  /** Color base: la cara superior se aclara y la lateral se oscurece para dar volumen. */
  color: string;
  animation?: PropAnimation;
  /** Retraso de la animación en segundos, para que no todo se mueva a la vez. */
  delay?: number;
  /** Planta circular (monedas, engranajes, ondas). */
  round?: boolean;
  /** Símbolo pintado en la cara superior ("S/", "$", "✓"). */
  label?: string;
}

export interface SceneDefinition {
  /** Color del suelo del diorama. */
  floor: string;
  props: readonly SceneProp[];
}

export const BASE_SIZE = 150;
export const BASE_HEIGHT = 22;

export const SCENES: Record<LevelScene, SceneDefinition> = {
  /** Edificio corporativo con ventanas encendidas (banca). */
  tower: {
    floor: '#16213e',
    props: [
      { x: 50, y: 36, w: 44, d: 44, h: 150, color: '#2563eb', animation: 'windows' },
      { x: 100, y: 80, w: 32, d: 32, h: 92, color: '#1e40af', animation: 'windows', delay: 0.6 },
      { x: 16, y: 86, w: 28, d: 28, h: 62, color: '#3b82f6', animation: 'windows', delay: 1.2 },
      { x: 66, y: 52, z: 150, w: 12, d: 12, h: 10, color: '#ffd166', animation: 'pulse' },
      { x: 20, y: 28, w: 14, d: 14, h: 22, color: '#10b981', animation: 'bob' },
      { x: 114, y: 24, w: 12, d: 12, h: 18, color: '#34d399', animation: 'bob', delay: 0.5 },
    ],
  },

  /** Tocador con frascos de colores (cosmética). */
  vanity: {
    floor: '#3b1d33',
    props: [
      { x: 38, y: 26, w: 74, d: 6, h: 96, color: '#cbd5e1' },
      { x: 20, y: 60, w: 110, d: 46, h: 34, color: '#f5d0e6' },
      { x: 30, y: 72, z: 34, w: 14, d: 14, h: 28, color: '#ff6b9a', animation: 'bob' },
      { x: 54, y: 76, z: 34, w: 12, d: 12, h: 20, color: '#c084fc', animation: 'bob', delay: 0.4 },
      { x: 76, y: 70, z: 34, w: 16, d: 16, h: 34, color: '#ffd166', animation: 'bob', delay: 0.8 },
      { x: 102, y: 78, z: 34, w: 12, d: 12, h: 18, color: '#5eead4', animation: 'bob', delay: 1.2 },
    ],
  },

  /** Monedas de soles y dólares que giran e intercambian (cambio de divisas). */
  exchange: {
    floor: '#0c2433',
    props: [
      { x: 22, y: 92, w: 106, d: 38, h: 26, color: '#0284c7' },
      { x: 26, y: 28, w: 34, d: 34, h: 8, color: '#f59e0b', round: true },
      { x: 26, y: 28, z: 10, w: 34, d: 34, h: 8, color: '#f59e0b', round: true },
      { x: 26, y: 28, z: 20, w: 34, d: 34, h: 8, color: '#fbbf24', round: true, animation: 'spin', label: 'S/' },
      { x: 90, y: 28, w: 34, d: 34, h: 8, color: '#16a34a', round: true },
      { x: 90, y: 28, z: 10, w: 34, d: 34, h: 8, color: '#22c55e', round: true, animation: 'spin-back', label: '$' },
      { x: 62, y: 46, z: 46, w: 26, d: 26, h: 5, color: '#fde68a', round: true, animation: 'slide', label: '⇄' },
    ],
  },

  /** Laboratorio con engranajes y una bombilla (innovación). */
  lab: {
    floor: '#1f1a3a',
    props: [
      { x: 14, y: 84, w: 122, d: 44, h: 30, color: '#64748b' },
      { x: 50, y: 92, z: 30, w: 40, d: 3, h: 26, color: '#38bdf8' },
      { x: 50, y: 95, z: 30, w: 40, d: 22, h: 3, color: '#e2e8f0' },
      { x: 20, y: 22, w: 46, d: 46, h: 10, color: '#a78bfa', round: true, animation: 'spin', label: '⚙' },
      { x: 66, y: 40, w: 30, d: 30, h: 10, color: '#7c5cff', round: true, animation: 'spin-back', label: '⚙' },
      { x: 110, y: 28, w: 6, d: 6, h: 52, color: '#94a3b8' },
      { x: 104, y: 22, z: 52, w: 18, d: 18, h: 18, color: '#ffd166', round: true, animation: 'pulse' },
    ],
  },

  /** Antena que emite ondas (telecomunicaciones). */
  antenna: {
    floor: '#0b2537',
    props: [
      { x: 25, y: 25, w: 100, d: 100, h: 1, color: '#00d1b2', round: true, animation: 'ripple' },
      { x: 25, y: 25, w: 100, d: 100, h: 1, color: '#00d1b2', round: true, animation: 'ripple', delay: 1.2 },
      { x: 55, y: 55, w: 40, d: 40, h: 14, color: '#475569' },
      { x: 70, y: 70, w: 10, d: 10, h: 140, color: '#cbd5e1' },
      { x: 62, y: 62, z: 108, w: 26, d: 26, h: 5, color: '#e2e8f0', round: true },
      { x: 71, y: 71, z: 140, w: 8, d: 8, h: 8, color: '#ff6b9a', animation: 'pulse' },
    ],
  },

  /** Panel publicitario con gráfico de barras (marketing y analítica). */
  billboard: {
    floor: '#241a2e',
    props: [
      { x: 38, y: 40, w: 8, d: 8, h: 64, color: '#475569' },
      { x: 104, y: 40, w: 8, d: 8, h: 64, color: '#475569' },
      { x: 24, y: 36, z: 64, w: 102, d: 8, h: 66, color: '#1d4ed8' },
      { x: 26, y: 104, w: 16, d: 16, h: 30, color: '#7c5cff', animation: 'grow' },
      { x: 52, y: 104, w: 16, d: 16, h: 50, color: '#00d1b2', animation: 'grow', delay: 0.3 },
      { x: 78, y: 104, w: 16, d: 16, h: 70, color: '#ff6b9a', animation: 'grow', delay: 0.6 },
      { x: 104, y: 104, w: 16, d: 16, h: 92, color: '#ffd166', animation: 'grow', delay: 0.9 },
    ],
  },

  /** Móvil gigante con apps que flotan (desarrollo web y móvil). */
  phone: {
    floor: '#132235',
    props: [
      { x: 45, y: 52, w: 60, d: 14, h: 112, color: '#0f172a' },
      { x: 50, y: 66, z: 9, w: 50, d: 2, h: 94, color: '#22d3ee' },
      { x: 22, y: 104, z: 36, w: 14, d: 14, h: 14, color: '#ff6b9a', animation: 'bob' },
      { x: 116, y: 96, z: 66, w: 14, d: 14, h: 14, color: '#ffd166', animation: 'bob', delay: 0.5 },
      { x: 18, y: 36, z: 92, w: 14, d: 14, h: 14, color: '#a78bfa', animation: 'bob', delay: 1 },
    ],
  },

  /** Terminal con una tarjeta que pasa y un ✓ (pasarela de pago). */
  payment: {
    floor: '#16291f',
    props: [
      { x: 50, y: 56, w: 50, d: 62, h: 40, color: '#334155' },
      { x: 58, y: 64, z: 40, w: 34, d: 18, h: 2, color: '#38bdf8' },
      { x: 34, y: 70, z: 58, w: 70, d: 44, h: 4, color: '#7c5cff', animation: 'slide', label: '••••' },
      { x: 108, y: 18, z: 26, w: 24, d: 24, h: 6, color: '#22c55e', round: true, animation: 'pulse', label: '✓' },
    ],
  },

  /** Escritorio con portátil y lámpara: la escena genérica. */
  desk: {
    floor: '#1b2340',
    props: [
      { x: 18, y: 60, w: 114, d: 56, h: 40, color: '#a16207' },
      { x: 48, y: 74, z: 40, w: 50, d: 30, h: 3, color: '#e2e8f0' },
      { x: 48, y: 74, z: 40, w: 50, d: 3, h: 32, color: '#38bdf8' },
      { x: 112, y: 68, z: 40, w: 6, d: 6, h: 34, color: '#94a3b8' },
      { x: 106, y: 62, z: 74, w: 18, d: 18, h: 10, color: '#ffd166', animation: 'pulse' },
    ],
  },
};

export function sceneFor(scene: LevelScene | null | undefined): SceneDefinition {
  return SCENES[scene ?? 'desk'];
}

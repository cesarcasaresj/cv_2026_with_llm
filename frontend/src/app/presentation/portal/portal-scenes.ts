// Escenas 3D de los portales entre secciones (spec.md, HU-21), con three.js.
// Este módulo solo se descarga la primera vez que alguien pulsa un enlace del menú: no pesa en la carga inicial.
//
// Cada escena es una función que monta sus objetos y devuelve `update(t)`, con t de 0 a 1 a lo largo del portal:
// - experience: un túnel del tiempo; los años de la experiencia vuelan hacia la cámara hasta el presente.
// - about:      el origen; una chispa estalla en partículas que se ordenan formando </>.
// - projects:   bloques que caen y se ensamblan como una ciudad de repositorios.
// - updates:    una antena que emite ondas, como un latido de noticias.
// - blog:       un libro que se abre y suelta sus páginas en espiral hacia la cámara.
//
// Un solo renderer para todas las escenas; al terminar cada una se libera su memoria de GPU.

import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import type { PortalSection } from './section-portal.service';

export interface PortalOptions {
  /** Años de la experiencia, del más antiguo al más reciente. */
  years: number[];
  durationMs: number;
}

export interface PortalPlayer {
  /** Reproduce una escena; la promesa se cumple al terminar o al saltarla. */
  play(section: PortalSection, options: PortalOptions): Promise<void>;
  skip(): void;
  dispose(): void;
}

interface BuiltScene {
  scene: Scene;
  camera: PerspectiveCamera;
  update(t: number): void;
}

const PALETTE = [0x7c5cff, 0x00d1b2, 0xff6b9a, 0xffd166, 0x38bdf8];
const GOLD = 0xffd166;

// ---------- Utilidades ----------

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
/** Rebote al caer, como una pelota que toca el suelo. */
function easeOutBounce(x: number): number {
  const n = 7.5625;
  const d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
}
/** Avance de una parte del portal: 0 antes de `from`, 1 después de `to`. */
const phase = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

function camera(aspect: number, z: number): PerspectiveCamera {
  const result = new PerspectiveCamera(60, aspect, 0.1, 100);
  result.position.set(0, 0, z);
  return result;
}

/** Texto como sprite: siempre mira a la cámara. */
function textSprite(text: string, color: string, height: number): Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  const fontSize = 128;
  context.font = `800 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  canvas.width = Math.ceil(context.measureText(text).width) + 40;
  canvas.height = fontSize + 40;
  context.font = `800 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  context.textBaseline = 'middle';
  context.shadowColor = color;
  context.shadowBlur = 24;
  context.fillStyle = color;
  context.fillText(text, 20, canvas.height / 2);
  const sprite = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }));
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1);
  return sprite;
}

/** Nube de estrellas de fondo. */
function starfield(count: number, spread: number, depth: number): Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = -Math.random() * depth;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  return new Points(geometry, new PointsMaterial({ color: 0xc3c9e6, size: 0.04, transparent: true, opacity: 0.8 }));
}

function lights(scene: Scene): void {
  scene.add(new AmbientLight(0xffffff, 0.55));
  const sun = new DirectionalLight(0xffffff, 1.4);
  sun.position.set(5, 8, 6);
  scene.add(sun);
  const violet = new PointLight(0x7c5cff, 30, 30);
  violet.position.set(-5, 3, 4);
  scene.add(violet);
}

/** Puntos que dibujan un texto: se muestrea un canvas 2D y cada píxel encendido es un destino. */
function textTargets(text: string, width: number, maxPoints: number): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.font = '900 210px "Segoe UI", system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#fff';
  context.fillText(text, 256, 128);
  const pixels = context.getImageData(0, 0, 512, 256).data;
  const points: number[] = [];
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 512; x += 4) {
      if (pixels[(y * 512 + x) * 4 + 3] > 128) points.push(((x - 256) / 512) * width, ((128 - y) / 512) * width, 0);
    }
  }
  // Si hay más píxeles que partículas, se reparten de forma uniforme
  const result = new Float32Array(maxPoints * 3);
  const total = points.length / 3;
  for (let i = 0; i < maxPoints; i++) {
    const source = Math.floor((i / maxPoints) * total) * 3;
    result.set(points.slice(source, source + 3), i * 3);
  }
  return result;
}

// ---------- Escenas ----------

/** Túnel del tiempo: anillos de colores y los años de la experiencia volando hacia la cámara. */
function experienceScene(aspect: number, options: PortalOptions): BuiltScene {
  const scene = new Scene();
  scene.fog = new Fog(0x0b1020, 4, 30);
  const view = camera(aspect, 6);
  const spacing = 2.4;

  for (let i = 0; i < 46; i++) {
    const ring = new Mesh(
      new TorusGeometry(3.2, 0.035, 8, 80),
      new MeshBasicMaterial({ color: PALETTE[i % PALETTE.length], transparent: true, opacity: 0.85 }),
    );
    ring.position.z = -i * spacing;
    scene.add(ring);
  }
  scene.add(starfield(900, 14, 110));

  const current = new Date().getFullYear();
  const years = options.years.length ? [...new Set([...options.years, current])] : [current - 3, current - 2, current - 1, current];
  const yearSprites = years.map((year, index) => {
    const isPresent = index === years.length - 1;
    const sprite = textSprite(String(year), isPresent ? '#ffd166' : '#f5f7ff', isPresent ? 1.5 : 0.9);
    sprite.position.set(isPresent ? 0 : (index % 2 ? 1.5 : -1.5), isPresent ? 0 : (index % 3) - 1, -8 - index * 9);
    scene.add(sprite);
    return sprite;
  });
  const finalZ = yearSprites[yearSprites.length - 1].position.z + 4.5;

  return {
    scene,
    camera: view,
    update(t) {
      view.position.z = 6 + (finalZ - 6) * easeInOutCubic(t);
      view.rotation.z = Math.sin(t * Math.PI) * 0.35;
    },
  };
}

/** El origen: una chispa que estalla y cuyas partículas se ordenan formando </>. */
function aboutScene(aspect: number): BuiltScene {
  const scene = new Scene();
  const view = camera(aspect, 7);
  const count = 1600;
  const targets = textTargets('</>', 7, count);

  const burst = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Dirección aleatoria sobre una esfera y radio entre 3 y 7
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 3 + Math.random() * 4;
    burst[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    burst[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    burst[i * 3 + 2] = radius * Math.cos(phi);
    const color = new Color(PALETTE[i % PALETTE.length]);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const positions = new BufferAttribute(new Float32Array(count * 3), 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', positions);
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  const particles = new Points(
    geometry,
    new PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false }),
  );
  scene.add(particles);

  const spark = new Mesh(new SphereGeometry(0.18, 24, 24), new MeshBasicMaterial({ color: 0xffffff }));
  scene.add(spark);
  const shockwave = new Mesh(
    new TorusGeometry(1, 0.04, 8, 96),
    new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0 }),
  );
  scene.add(shockwave);
  scene.add(starfield(500, 20, 20));

  return {
    scene,
    camera: view,
    update(t) {
      // 1. La chispa late y crece
      const glow = phase(t, 0, 0.22);
      spark.scale.setScalar(0.4 + glow * 2.2 + Math.sin(t * 60) * 0.15 * glow);
      spark.visible = t < 0.26;
      // 2. Estallido hacia fuera, con una onda dorada
      const out = easeOutCubic(phase(t, 0.22, 0.45));
      const ring = phase(t, 0.22, 0.5);
      shockwave.scale.setScalar(0.5 + ring * 8);
      (shockwave.material as MeshBasicMaterial).opacity = ring > 0 && ring < 1 ? 1 - ring : 0;
      // 3. Las partículas se ordenan formando </>
      const gather = easeInOutCubic(phase(t, 0.48, 0.9));
      const array = positions.array as Float32Array;
      for (let i = 0; i < array.length; i++) {
        const exploded = burst[i] * out;
        array[i] = exploded + (targets[i] - exploded) * gather;
      }
      positions.needsUpdate = true;
      particles.rotation.y = (1 - gather) * t * 2;
    },
  };
}

/** Ciudad de repositorios: bloques que caen con rebote y se ensamblan en una cuadrícula. */
function projectsScene(aspect: number): BuiltScene {
  const scene = new Scene();
  lights(scene);
  const view = camera(aspect, 10);
  const blocks: { mesh: Mesh; finalY: number; startY: number; delay: number }[] = [];
  const size = 5;

  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const height = 0.6 + Math.random() * 2.8;
      const mesh = new Mesh(
        new BoxGeometry(0.85, height, 0.85),
        new MeshStandardMaterial({ color: PALETTE[(x + z) % PALETTE.length], roughness: 0.35, metalness: 0.2 }),
      );
      const finalY = height / 2;
      const startY = 10 + Math.random() * 4;
      mesh.position.set((x - (size - 1) / 2) * 1.1, startY, (z - (size - 1) / 2) * 1.1);
      scene.add(mesh);
      blocks.push({ mesh, finalY, startY, delay: (x + z) * 0.035 + Math.random() * 0.05 });
    }
  }
  const ground = new Mesh(
    new PlaneGeometry(9, 9),
    new MeshStandardMaterial({ color: 0x151b33, roughness: 0.9, side: DoubleSide }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  return {
    scene,
    camera: view,
    update(t) {
      for (const block of blocks) {
        const fall = phase(t, block.delay, block.delay + 0.4);
        block.mesh.position.y = block.startY + (block.finalY - block.startY) * easeOutBounce(fall);
      }
      // La cámara gira despacio alrededor de la ciudad
      const angle = 0.6 + t * 0.9;
      view.position.set(Math.sin(angle) * 9, 6.5 - t * 1.5, Math.cos(angle) * 9);
      view.lookAt(0, 0.8, 0);
    },
  };
}

/** Señal en directo: una antena que late y emite ondas. */
function updatesScene(aspect: number): BuiltScene {
  const scene = new Scene();
  lights(scene);
  const view = camera(aspect, 7);
  view.position.y = 1.2;

  const mast = new Mesh(
    new CylinderGeometry(0.07, 0.16, 3.4, 16),
    new MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6, roughness: 0.3 }),
  );
  mast.position.y = -0.7;
  scene.add(mast);
  const beacon = new Mesh(new SphereGeometry(0.2, 24, 24), new MeshBasicMaterial({ color: 0xff6b9a }));
  beacon.position.y = 1.05;
  scene.add(beacon);

  const waves = Array.from({ length: 7 }, (_, index) => {
    const wave = new Mesh(
      new TorusGeometry(1, 0.03, 8, 96),
      new MeshBasicMaterial({ color: PALETTE[index % PALETTE.length], transparent: true }),
    );
    wave.position.y = 1.05;
    scene.add(wave);
    return wave;
  });
  scene.add(starfield(700, 18, 18));

  return {
    scene,
    camera: view,
    update(t) {
      beacon.scale.setScalar(1 + Math.sin(t * 40) * 0.35);
      waves.forEach((wave, index) => {
        // Cada onda nace, crece y se apaga; las siguientes van detrás
        const life = (t * 2.6 + index / waves.length) % 1;
        wave.scale.setScalar(0.3 + life * 5);
        (wave.material as MeshBasicMaterial).opacity = 1 - life;
        wave.rotation.x = 0.35 + index * 0.08;
        wave.rotation.y = t * 0.6;
      });
      view.position.z = 7 - t * 2;
      view.lookAt(0, 0.6, 0);
    },
  };
}

/** Un libro que se abre y suelta sus páginas en espiral hacia la cámara. */
function blogScene(aspect: number): BuiltScene {
  const scene = new Scene();
  lights(scene);
  const view = camera(aspect, 6.5);

  const coverMaterial = new MeshStandardMaterial({ color: 0x7c5cff, roughness: 0.5 });
  const left = new Group();
  const right = new Group();
  for (const [group, side] of [[left, -1], [right, 1]] as const) {
    const cover = new Mesh(new BoxGeometry(1.7, 2.3, 0.08), coverMaterial);
    cover.position.x = side * 0.85; // la bisagra queda en el lomo (x = 0)
    group.add(cover);
    scene.add(group);
  }

  // Páginas claras con un tinte suave de la paleta: sin luces, para que no se vean grises al girar
  const pageGeometry = new PlaneGeometry(0.75, 1.05);
  const pages = Array.from({ length: 26 }, (_, index) => {
    const tint = new Color(0xffffff).lerp(new Color(PALETTE[index % PALETTE.length]), 0.18);
    const page = new Mesh(pageGeometry, new MeshBasicMaterial({ color: tint, side: DoubleSide }));
    page.visible = false;
    scene.add(page);
    return { page, delay: 0.3 + index * 0.018, offset: index * 0.9 };
  });
  scene.add(starfield(500, 18, 18));

  return {
    scene,
    camera: view,
    update(t) {
      // El libro empieza cerrado y de canto, y se abre
      const open = easeOutCubic(phase(t, 0.05, 0.35));
      left.rotation.y = -Math.PI / 2 + open * (Math.PI / 2 - 0.25);
      right.rotation.y = Math.PI / 2 - open * (Math.PI / 2 - 0.25);
      for (const { page, delay, offset } of pages) {
        const flight = phase(t, delay, delay + 0.45);
        page.visible = flight > 0;
        const angle = flight * Math.PI * 3 + offset;
        const radius = flight * 2.6;
        // Salen del libro en espiral hacia la cámara, pero sin llegar a taparla
        page.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.6, flight * 3.2);
        page.rotation.set(flight * 4 + offset, flight * 6, flight * 2);
      }
      view.position.z = 6.5 - t * 1.2;
    },
  };
}

const BUILDERS: Record<PortalSection, (aspect: number, options: PortalOptions) => BuiltScene> = {
  experience: experienceScene,
  about: aboutScene,
  projects: projectsScene,
  updates: updatesScene,
  blog: blogScene,
};

/** Libera geometrías, materiales y texturas de una escena terminada. */
function disposeScene(scene: Scene): void {
  scene.traverse((object: Object3D) => {
    const mesh = object as Mesh;
    mesh.geometry?.dispose();
    const materials = (Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) as Material[];
    for (const material of materials) {
      const map = (material as Material & { map?: Texture }).map;
      map?.dispose();
      material.dispose();
    }
  });
}

/** Crea el reproductor sobre un canvas. Sin WebGL devuelve null y el portal simplemente no se muestra. */
export function createPortalPlayer(canvas: HTMLCanvasElement): PortalPlayer | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  let frame = 0;
  let skipped = false;

  return {
    play(section, options) {
      skipped = false;
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      const built = BUILDERS[section](width / height, options);
      const start = performance.now();

      return new Promise<void>((resolve) => {
        const tick = (now: number) => {
          const t = Math.min((now - start) / options.durationMs, 1);
          built.update(t);
          renderer.render(built.scene, built.camera);
          if (t >= 1 || skipped) {
            disposeScene(built.scene);
            resolve();
          } else {
            frame = requestAnimationFrame(tick);
          }
        };
        frame = requestAnimationFrame(tick);
      });
    },
    skip() {
      skipped = true;
    },
    dispose() {
      cancelAnimationFrame(frame);
      renderer.dispose();
    },
  };
}

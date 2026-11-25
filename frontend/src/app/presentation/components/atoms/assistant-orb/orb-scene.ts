// Esfera de energía del botón "Pregúntale a mi CV" (spec.md, HU-24), con three.js.
// Este módulo se descarga aparte cuando la página ya cargó: no pesa en la carga inicial.
//
// - Una esfera "líquida": un ruido 3D deforma su superficie y la colorea entre violeta y dorado.
// - Un halo que brilla en los bordes (efecto Fresnel) y partículas que orbitan en un anillo inclinado.
// - `setExcited(true)` (cursor o foco en el botón): late más fuerte, gira más rápido y crece un poco.
// - `setPointer(x, y)`: la esfera se inclina hacia el puntero.
// Se detiene sola cuando la pestaña no se ve.

import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';

export interface OrbScene {
  setExcited(excited: boolean): void;
  /** Posición del puntero respecto al centro del orbe, de -1 a 1 en cada eje. */
  setPointer(x: number, y: number): void;
  dispose(): void;
}

const DEEP = new Color('#2a0f57');
const VIOLET = new Color('#9a3ff0');
const GOLD = new Color('#ffd166');
const CYAN = new Color('#7be0ff');

// Ruido simplex 3D (Ian McEwan, Ashima Arts; licencia MIT)
const NOISE = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

function createCore(): Mesh<IcosahedronGeometry, ShaderMaterial> {
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uExcite: { value: 0 },
      uDeep: { value: DEEP },
      uViolet: { value: VIOLET },
      uGold: { value: GOLD },
      uCyan: { value: CYAN },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uExcite;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      ${NOISE}
      void main() {
        float speed = 0.45 + uExcite * 0.9;
        float n = snoise(normal * (0.95 + uExcite * 0.45) + uTime * speed);
        vNoise = n;
        vec3 displaced = position + normal * n * (0.1 + uExcite * 0.14);
        vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uExcite;
      uniform vec3 uDeep;
      uniform vec3 uViolet;
      uniform vec3 uGold;
      uniform vec3 uCyan;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      void main() {
        // Volumen: luz desde arriba a la izquierda, como el resto de escenas de la web
        float light = clamp(dot(vNormal, normalize(vec3(-0.45, 0.6, 0.7))) * 0.5 + 0.5, 0.0, 1.0);
        vec3 color = mix(uDeep, uViolet, light);
        // Vetas de energía doradas donde el ruido llega a su cresta
        float vein = smoothstep(0.12, 0.62, vNoise);
        color = mix(color, uGold, vein * (0.75 + uExcite * 0.25));
        // Brillo especular y borde que brilla (Fresnel)
        color += vec3(1.0, 0.95, 0.85) * pow(light, 14.0) * 0.55;
        float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
        color += uCyan * fresnel * (0.7 + uExcite * 0.6);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  return new Mesh(new IcosahedronGeometry(1, 48), material);
}

/** Halo: una esfera algo mayor, vista por dentro, que solo brilla en el borde. */
function createHalo(): Mesh<IcosahedronGeometry, ShaderMaterial> {
  const material = new ShaderMaterial({
    uniforms: { uExcite: { value: 0 }, uGold: { value: GOLD }, uCyan: { value: CYAN } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uExcite;
      uniform vec3 uGold;
      uniform vec3 uCyan;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(max(dot(vNormal, vView), 0.0), 3.0);
        vec3 color = mix(uCyan, uGold, 0.35 + uExcite * 0.4);
        gl_FragColor = vec4(color, rim * (0.55 + uExcite * 0.45));
      }
    `,
    side: BackSide,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  return new Mesh(new IcosahedronGeometry(1.32, 12), material);
}

/** Partículas en un anillo inclinado, como una pequeña galaxia alrededor de la esfera. */
function createParticles(count: number): Points<BufferGeometry, ShaderMaterial> {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.4 + Math.random() * 0.45;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.22;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    seeds[i] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));

  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uExcite: { value: 0 }, uScale: { value: 1 }, uGold: { value: GOLD } },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uExcite;
      uniform float uScale;
      attribute float aSeed;
      varying float vTwinkle;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position * (1.0 + uExcite * 0.12), 1.0);
        vTwinkle = 0.55 + 0.45 * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 40.0);
        gl_PointSize = (1.4 + aSeed * 2.0) * (1.0 + uExcite * 0.6) * uScale / -viewPosition.z;
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uGold;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.0, d) * vTwinkle;
        gl_FragColor = vec4(uGold, alpha);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  return new Points(geometry, material);
}

/** Monta la escena en el canvas. Devuelve null si el navegador no puede crear un contexto WebGL. */
export function createOrbScene(canvas: HTMLCanvasElement): OrbScene | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  const orb = new Group();
  const core = createCore();
  const halo = createHalo();
  const ring = new Group();
  const particles = createParticles(140);
  ring.add(particles);
  ring.rotation.set(0.55, 0, -0.18);
  orb.add(core, halo, ring);
  scene.add(orb);

  const resize = (): void => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // El tamaño de las partículas va en píxeles: se ajusta al tamaño del canvas
    particles.material.uniforms['uScale'].value = (height * pixelRatio) / 9;
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  let excited = 0;
  let excitedTarget = 0;
  const tilt = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let spin = 0;
  let last = performance.now();
  let elapsed = 0;
  let frame = 0;

  const render = (now: number): void => {
    // Pasos limitados: al volver a la pestaña no hay un salto brusco
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += delta;
    excited += (excitedTarget - excited) * Math.min(delta * 5, 1);
    tilt.x += (tilt.targetX - tilt.x) * Math.min(delta * 4, 1);
    tilt.y += (tilt.targetY - tilt.y) * Math.min(delta * 4, 1);
    spin += delta * (0.35 + excited * 1.1);

    core.material.uniforms['uTime'].value = elapsed;
    core.material.uniforms['uExcite'].value = excited;
    halo.material.uniforms['uExcite'].value = excited;
    particles.material.uniforms['uTime'].value = elapsed;
    particles.material.uniforms['uExcite'].value = excited;

    core.rotation.y = spin;
    particles.rotation.y = -spin * 1.6;
    orb.rotation.x = tilt.y * 0.45;
    orb.rotation.y = tilt.x * 0.6;
    // Late: respira despacio en reposo y algo más fuerte al activarse
    orb.scale.setScalar(1 + excited * 0.08 + Math.sin(elapsed * 2.2) * (0.015 + excited * 0.02));

    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };

  const onVisibility = (): void => {
    cancelAnimationFrame(frame);
    if (!document.hidden) {
      last = performance.now();
      frame = requestAnimationFrame(render);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();

  return {
    setExcited(value) {
      excitedTarget = value ? 1 : 0;
    },
    setPointer(x, y) {
      tilt.targetX = Math.max(-1, Math.min(1, x));
      tilt.targetY = Math.max(-1, Math.min(1, y));
    },
    dispose() {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
      for (const mesh of [core, halo, particles]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      renderer.dispose();
    },
  };
}

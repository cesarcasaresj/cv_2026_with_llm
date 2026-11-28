// Datos ficticios compartidos por las stories de la portada.
import type { Profile, Project, ProfileUpdate } from '../../core/portfolio/portfolio.types';

export const profileFixture: Profile = {
  lang: 'es',
  name: 'Persona de Ejemplo',
  headline: 'Arquitecta de software · Angular, Node.js y accesibilidad web',
  location: 'Ciudad de Ejemplo',
  about: [
    'Diseño aplicaciones web que se pueden mantener: contratos claros entre equipos, secretos fuera del código y componentes que cualquiera puede usar.',
    'Me gusta convertir requisitos difusos en historias verificables.',
  ],
  experience: [
    {
      company: 'Empresa de Ejemplo',
      title: 'Arquitecta de software',
      location: 'Remoto',
      startedOn: '2023-03',
      finishedOn: null,
      description: 'Defino la arquitectura de los productos web: contratos OpenAPI y Clean Architecture.',
      scene: 'tower',
      client: 'Un banco de ejemplo · banca digital',
      highlights: [
        'Desarrollo funcionalidades de banca digital con Angular y TypeScript para más de 400 000 clientes.',
        'Integré LLMs en producción: chatbots, búsqueda inteligente y acciones automáticas.',
      ],
    },
    {
      company: 'Estudio Ficticio',
      title: 'Desarrolladora full stack',
      location: 'Ciudad de Ejemplo',
      startedOn: '2019-06',
      finishedOn: '2023-02',
      description: 'Aplicaciones Angular y Node.js para comercio y educación.',
      scene: 'phone',
      client: null,
      highlights: [],
    },
  ],
  skills: [
    { group: 'Frontend', items: ['Angular', 'React', 'TypeScript', 'RxJS'] },
    { group: 'IA y LLM', items: ['Integración de LLMs', 'Tool calling'] },
  ],
  education: [{ degree: 'Ingeniería de Sistemas', school: 'Universidad de Ejemplo', year: 2015 }],
  languages: [
    { name: 'Español', level: 'Nativo' },
    { name: 'Inglés', level: 'B2' },
  ],
  facts: ["7+ años en frontend", "Banca digital · 400 000+ clientes", "LLMs en producción"],
  availability: "Remoto desde LATAM · horario compatible con EE. UU.",
  links: { github: 'https://github.com/ejemplo', linkedin: 'https://www.linkedin.com/in/ejemplo' },
};

export const projectsFixture: Project[] = [
  {
    name: 'cv-2026',
    description: 'CV con arquitectura limpia, Vault, OpenAPI y Angular SSR.',
    url: 'https://github.com/ejemplo/cv-2026',
    homepage: 'https://ejemplo.dev',
    language: 'TypeScript',
    stars: 12,
    forks: 2,
    topics: ['angular', 'threejs', 'a11y'],
    pushedAt: '2026-11-14T10:00:00Z',
  },
  {
    name: 'go-learning',
    description: 'Ejercicios de Go con pruebas.',
    url: 'https://github.com/ejemplo/go-learning',
    homepage: null,
    language: 'Go',
    stars: 0,
    forks: 0,
    topics: [],
    pushedAt: '2026-04-02T10:00:00Z',
  },
  {
    name: 'api-express',
    description: null,
    url: 'https://github.com/ejemplo/api-express',
    homepage: null,
    language: 'JavaScript',
    stars: 3,
    forks: 1,
    topics: ['express'],
    pushedAt: '2025-08-20T10:00:00Z',
  },
];

export const updatesFixture: ProfileUpdate[] = [
  {
    publishedAt: '2026-11-14T18:30:00Z',
    text: 'Publiqué la nueva versión de mi CV con Angular SSR y three.js. #Angular',
    url: 'https://www.linkedin.com/feed/update/ejemplo-1',
  },
  { publishedAt: '2026-11-02T09:15:00Z', text: 'Contratos OpenAPI como fuente de verdad.', url: null },
  { publishedAt: '2026-10-20T12:00:00Z', text: 'Un solo h1 por página y encabezados sin saltos.', url: null },
];

/**
 * Textos de la interfaz en español (spec.md, HU-18). Es el diccionario de referencia: su forma define el tipo
 * `Messages`, y el diccionario inglés debe tener exactamente las mismas claves (si falta o sobra una, no compila).
 *
 * - Los textos fijos son cadenas.
 * - Los que dependen de un dato (plurales, nombres) son funciones pequeñas: así cada idioma usa su propia gramática.
 * - Los formatos de fecha son patrones del pipe `date` de Angular.
 */
export const es = {
  app: {
    skipToContent: 'Saltar al contenido',
  },

  language: {
    label: 'Idioma',
    names: { es: 'Español', en: 'English' },
    changed: (name: string) => `Idioma: ${name}`,
  },

  header: {
    brandLabel: 'Cesar Casares, ir al inicio',
    navLabel: 'Principal',
    experience: 'Experiencia',
    about: 'Sobre mí',
    projects: 'Proyectos',
    updates: 'Actualidad',
    blog: 'Blog',
    /** Distintivo del efecto de Actualidad en el menú (HU-21). */
    live: '● EN VIVO',
  },

  hero: {
    greeting: 'Hola, soy',
    projectsCta: 'Ver proyectos',
    blogCta: 'Leer el blog',
    profilesLabel: 'Perfiles',
    loading: 'Cargando el perfil…',
    error: 'No pudimos cargar el perfil. Intenta de nuevo en unos minutos.',
  },

  /** Portales entre secciones (HU-21). */
  portal: {
    skip: 'Clic o Esc para saltar',
  },

  /** La nana de las ideas (HU-19): el teclado de notas de la portada. */
  melody: {
    padLabel: 'Partitura: toca las notas',
    notes: { idea: 'Idea', code: 'Código', spark: 'Chispa', web: 'Web', dream: 'Sueño' },
    keysHelp: 'Teclas 1 a 5',
    sound: 'Sonido',
    hint: 'Hay una nana escondida… ✦',
    hintStart: (glyphs: string) => `Pista: empieza así ${glyphs} …`,
    progress: (done: number, total: number) => `${done} de ${total} notas de la nana`,
    discovered: '✦ Melodía descubierta: la nana de las ideas',
    announceDiscovered: '¡Melodía descubierta: la nana de las ideas! Modo fiesta activado.',
    endParty: 'Terminar la fiesta',
    announceEnded: 'Fiesta terminada.',
  },

  experience: {
    title: 'Experiencia',
    loading: 'Cargando la experiencia…',
    error: 'No pudimos cargar la experiencia. Intenta de nuevo en unos minutos.',
    empty: 'Todavía no hay experiencia cargada.',
    now: 'actualidad',
    dateFormat: 'MMM y',
    /** "2 años y 3 meses", "8 meses". */
    duration: (years: number, months: number) =>
      [years ? `${years} ${years === 1 ? 'año' : 'años'}` : '', months ? `${months} ${months === 1 ? 'mes' : 'meses'}` : '']
        .filter(Boolean)
        .join(' y '),
  },

  /** El viaje de la experiencia (HU-20): un nivel por puesto, del presente al inicio. */
  journey: {
    intro: 'Un viaje por mi trayectoria, del presente hasta donde empezó todo. Avanza con el scroll o con los botones.',
    hud: (level: number, total: number) => `Nivel ${level} / ${total}`,
    controlsLabel: 'Recorrer los niveles',
    previous: 'Nivel anterior',
    next: 'Siguiente nivel',
    goTo: (level: number) => `Ir al nivel ${level}`,
    xp: (years: number): string => (years < 1 ? 'XP: el comienzo' : `XP: ${years} ${years === 1 ? 'año' : 'años'}`),
    start: '🏁 Aquí empezó todo',
    backToPresent: 'Volver al presente',
    announce: (level: number, total: number, title: string, company: string) => `Nivel ${level} de ${total}: ${title}, ${company}`,
  },

  about: {
    title: 'Acerca de mí',
    loading: 'Cargando…',
    error: 'No pudimos cargar esta sección. Intenta de nuevo en unos minutos.',
    years: (n: number): string => (n === 1 ? 'año de experiencia' : 'años de experiencia'),
    companies: (n: number): string => (n === 1 ? 'empresa' : 'empresas'),
    projects: (n: number): string => (n === 1 ? 'proyecto público' : 'proyectos públicos'),
  },

  projects: {
    title: 'Proyectos',
    intro: 'Lo último en lo que he trabajado, directo de mis repositorios públicos de GitHub.',
    loading: 'Cargando los proyectos de GitHub…',
    githubDown: 'GitHub no responde en este momento.',
    seeOnGithub: 'Puedes ver los proyectos directamente en',
    githubProfile: 'mi perfil de GitHub',
    retry: 'Intenta de nuevo en unos minutos.',
    noDescription: 'Sin descripción en GitHub.',
    topicsLabel: 'Temas',
    stars: 'estrellas',
    updated: 'Actualizado',
    justNow: 'ahora mismo',
    demo: 'Ver demo',
    demoOf: (name: string) => ` de ${name}`,
    all: 'Todos mis repositorios en GitHub →',
    empty: 'Todavía no hay proyectos públicos.',
  },

  updates: {
    title: 'Actualidad',
    intro: 'En qué ando ahora, según lo que comparto en LinkedIn.',
    loading: 'Cargando las publicaciones…',
    error: 'No pudimos cargar las publicaciones. Intenta de nuevo en unos minutos.',
    empty: 'Todavía no hay publicaciones.',
    dateFormat: "d 'de' MMMM 'de' y",
    shortDateFormat: "d 'de' MMMM",
    viewOnLinkedin: 'Ver en LinkedIn',
    postOf: (date: string) => ` la publicación del ${date}`,
    follow: 'Sígueme en LinkedIn →',
  },

  teaser: {
    title: '¿Quieres leer cómo está hecho todo esto?',
    text: 'Escribo sobre arquitectura, seguridad, contratos de API y accesibilidad en el blog.',
    cta: 'Ir al blog',
  },

  blog: {
    title: 'Blog',
    intro: 'Artículos sobre arquitectura de software, seguridad, contratos de API y accesibilidad web.',
    categories: 'Categorías',
    tags: 'Etiquetas',
  },

  postCounter: {
    title: 'Publicaciones totales',
    loading: 'Cargando…',
    error: 'No pudimos cargar el total. Intenta de nuevo en unos minutos.',
    announceLoading: 'Cargando el total de publicaciones',
    announceError: 'No se pudo cargar el total de publicaciones',
    announceTotal: (total: number) => `Total de publicaciones: ${total}`,
  },

  postList: {
    title: 'Artículos',
    loading: 'Cargando artículos…',
    empty: 'No hay artículos con estos filtros.',
    error: 'No pudimos cargar los artículos. Intenta de nuevo en unos minutos.',
    filterNotFound: 'Ese filtro ya no existe. Quítalo para ver todos los artículos.',
    count: (n: number): string => (n === 1 ? '1 artículo' : `${n} artículos`),
  },

  /** `label` es el nombre del filtro en minúsculas: "categorías" o "etiquetas". */
  taxonomy: {
    loading: (label: string) => `Cargando ${label}…`,
    error: (label: string) => `No pudimos cargar las ${label}. Intenta de nuevo en unos minutos.`,
    empty: (label: string) => `Todavía no hay ${label}`,
    announceError: (label: string) => `No se pudieron cargar las ${label}`,
  },

  article: {
    loading: 'Cargando el artículo…',
    notFoundTitle: 'No encontramos este artículo',
    notFoundText: 'Puede que la dirección esté mal escrita o que el artículo ya no exista.',
    errorTitle: 'No pudimos cargar el artículo',
    errorText: 'Intenta de nuevo en unos minutos.',
    back: 'Volver al blog',
    by: 'Por',
    updatedOn: 'Actualizado el',
    reading: (minutes: number) => `Lectura de ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`,
    tagsLabel: 'Etiquetas del artículo',
    announceLoading: 'Cargando el artículo',
    seoNotFoundTitle: 'Artículo no encontrado',
    seoNotFoundDescription: 'El artículo que buscas no existe o ya no está disponible.',
  },

  login: {
    title: 'Iniciar sesión',
    email: 'Correo electrónico',
    emailHint: 'Escribe un correo válido.',
    password: 'Contraseña',
    passwordHint: 'Escribe tu contraseña.',
    submit: 'Iniciar sesión',
    submitting: 'Entrando…',
    genericError: 'No pudimos iniciar sesión. Intenta de nuevo en unos minutos.',
    seoDescription: 'Acceso del autor del sitio.',
  },

  account: {
    title: 'Mi cuenta',
    manageLabel: 'Gestión del sitio',
    categoriesLink: 'Categorías y su asignación a los artículos',
    logoutError: 'No pudimos cerrar la sesión. Intenta de nuevo en unos minutos.',
    seoDescription: 'Sesión del autor del sitio.',
    sessionTitle: 'Sesión iniciada',
    signedInAs: 'Has iniciado sesión como',
    logout: 'Cerrar sesión',
    loggingOut: 'Cerrando sesión…',
  },

  categories: {
    back: '← Volver a Mi cuenta',
    title: 'Categorías',
    intro: 'La lista de categorías es fija: solo cambia desde aquí. Cada artículo tiene exactamente una.',
    seoDescription: 'Gestión de la lista de categorías y de la categoría de cada artículo.',
    saveError: 'No pudimos guardar el cambio. Intenta de nuevo en unos minutos.',
    created: (name: string) => `Categoría «${name}» creada.`,
    renamed: (name: string) => `Categoría renombrada a «${name}».`,
    deleted: (name: string | null): string => (name ? `Categoría «${name}» borrada.` : 'Categoría borrada.'),
    moved: (post: string, category: string) => `«${post}» ahora está en «${category}».`,

    listTitle: 'Lista de categorías',
    newLabel: 'Nueva categoría',
    create: 'Crear',
    nameHint: 'De 2 a 40 caracteres. No puede repetir otra categoría.',
    nameError: 'Escribe un nombre de 2 a 40 caracteres.',
    loading: 'Cargando las categorías…',
    error: 'No pudimos cargar las categorías. Intenta de nuevo en unos minutos.',
    empty: 'Todavía no hay categorías. Crea la primera.',
    renameLabel: (name: string) => `Nuevo nombre de «${name}»`,
    save: 'Guardar',
    saving: 'Guardando…',
    cancel: 'Cancelar',
    renameHint: 'Sus artículos conservan la categoría; cambia también su dirección en los filtros.',
    postCount: (n: number): string => (n === 1 ? '1 artículo' : `${n} artículos`),
    rename: 'Renombrar',
    deleteBlocked: 'Para borrarla, asigna otra categoría a sus artículos.',
    confirmDelete: (name: string) => `¿Borrar «${name}»?`,
    confirmYes: 'Sí, borrar',
    delete: 'Borrar',

    assignTitle: 'Categoría de cada artículo',
    assignHint: 'Cada artículo tiene una sola categoría. Elige la nueva y pulsa «Guardar».',
    postsLoading: 'Cargando los artículos…',
    postsError: 'No pudimos cargar los artículos. Intenta de nuevo en unos minutos.',
    columnArticle: 'Artículo',
    columnCategory: 'Categoría',
    published: 'Publicado',
    draft: 'Borrador',
    categoryOf: (title: string) => `Categoría de «${title}»`,
    saveCategoryOf: (title: string) => ` la categoría de «${title}»`,
    postsEmpty: 'Todavía no hay artículos. Cárgalos con',
  },

  seo: {
    locale: 'es_ES',
    homeTitle: 'Inicio',
    homeDescription: 'Portafolio: experiencia, proyectos de GitHub, publicaciones recientes y blog técnico.',
  },
};

/** Forma de cualquier diccionario: la misma que el español, con cadenas y funciones en lugar de literales. */
export type Messages = typeof es;

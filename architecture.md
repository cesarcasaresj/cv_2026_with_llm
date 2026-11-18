# Arquitectura física del monorepo

```text
├── .vault/                 # Script de carga de secretos para Vault local (sin secretos reales)
│   └── seed.sh             # Escribe en Vault las credenciales de la BD leídas del .env
├── contracts/              # Contrato único frontend ↔ backend
│   └── openapi.yaml        # OpenAPI 3.1 (REST/JSON). Fuente de verdad de la API
├── content/
│   ├── articulos/          # Artículos en Markdown con front matter; imagenes/ guarda las portadas originales
│   └── linkedin-ejemplo/   # Exportación de LinkedIn ficticia para probar load:linkedin (la real va fuera del repo)
├── backend/                # AGENTE DE BACKEND (Node.js + TypeScript + Express 5)
│   ├── db/
│   │   └── init/           # Migraciones SQL en orden (001 posts … 005 artículos y etiquetas)
│   ├── scripts/            # create-user.ts, load-content.ts (artículos) y load-linkedin.ts (perfil desde LinkedIn)
│   ├── src/
│   │   ├── core/           # Capa agnóstica (Clean Architecture). No importa nada de infrastructure
│   │   │   ├── domain/     # Modelos, puertos (repositorios, Markdown, sesión) y errores
│   │   │   └── usecases/   # Casos de uso puros y sus pruebas unitarias (.spec.ts)
│   │   ├── infrastructure/ # Capa de implementación
│   │   │   ├── content/    # Markdown → HTML (marked), con los encabezados bajados un nivel
│   │   │   ├── controllers/# Rutas REST públicas y del autor (/api/v1/author, con sesión), sitemap/robots y errores
│   │   │   ├── database/   # Pool de PostgreSQL y repositorios que implementan el dominio
│   │   │   ├── github/     # Repositorios públicos desde la API de GitHub, con caché de una hora
│   │   │   └── security/   # Vault, scrypt y JWT
│   │   ├── generated/      # Tipos generados desde contracts/openapi.yaml (no editar)
│   │   └── main.ts         # Punto de entrada: arma las dependencias y levanta el servidor
│   └── package.json
│
├── frontend/               # AGENTE DE FRONTEND (Angular 22 zoneless con SSR)
│   ├── public/images/articulos/ # Portadas AVIF/WebP/JPG generadas por load:content (no se suben a git)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Infraestructura del cliente: sesión, SEO (SeoService), tipos generados
│   │   │   └── presentation/ # UI basada en Atomic Design y A11y
│   │   │       ├── components/
│   │   │       │   ├── atoms/     # SectionHeading
│   │   │       │   ├── molecules/ # PostCounter, TaxonomyFilter, PostList, LoginForm, SessionInfo, PostCategoryList
│   │   │       │   └── organisms/ # SiteHeader, HeroSection, ExperienceTimeline, AboutSection, ProjectGrid,
│   │   │       │                  # UpdateFeed, ArticleView, CategoryManager
│   │   │       ├── motion/        # Directivas de efectos (aparición al hacer scroll, inclinación 3D)
│   │   │       ├── melody/        # La nana de las ideas: notas, melodía secreta, sonido y pentagrama (canvas)
│   │   │       └── pages/         # Portafolio (/), blog, artículo, login, cuenta y categorías
│   │   ├── app.routes.server.ts # Qué rutas se renderizan en el servidor (públicas) y cuáles en el navegador
│   │   ├── server.ts       # Servidor SSR de producción: renderiza y reenvía /api, /sitemap.xml y /robots.txt
│   │   └── main.ts         # Inicialización de la aplicación Angular zoneless
│   ├── proxy.conf.json     # En desarrollo, redirige /api, /sitemap.xml y /robots.txt → http://localhost:8081
│   ├── .storybook/         # Configuración del Design System independiente
│   └── package.json
│
├── docker-compose.yml      # PostgreSQL + Vault (modo dev) + carga inicial de secretos
├── .env.example            # Variables de ejemplo. Copiar a .env (que nunca se sube a git)
├── .gitignore
├── constitution.md         # Leyes mandatorias de desarrollo
├── references.md           # Patrones de código de referencia
└── plan.md                 # Plan por fases
```

## Flujo de una petición en local

```text
Navegador o robot de búsqueda
   │  GET /articulos/mi-articulo
   ▼
Servidor de Angular (:4200, SSR)
   │  1. Renderiza la página: pide GET /api/v1/posts/mi-articulo a través de su propio proxy
   │  2. Devuelve HTML completo (contenido, <title>, meta, JSON-LD) y el navegador lo hidrata
   ▼
Backend Express (:8081)        ← /api, /sitemap.xml y /robots.txt (cookie de sesión HttpOnly en las rutas de auth)
   │  Al arrancar, lee de Vault las credenciales de la BD y la clave del JWT
   ▼
Vault (:8200) · PostgreSQL (:5432)
```

## Decisiones tomadas

| Tema | Decisión | Motivo |
|---|---|---|
| Protocolo | REST/JSON | Nativo en Angular (`HttpClient`, `httpResource`, interceptores); compatible con login por cookie, OAuth, subida de archivos y APIs externas |
| Contrato | OpenAPI 3.1 en `contracts/` | Tipado de extremo a extremo sin gRPC |
| Base de datos | PostgreSQL 17 en Docker | Tiene credenciales reales que Vault protege |
| Secretos | Vault en modo dev (local) | Mismo flujo que producción, sin instalar nada |
| Servidor | Express 5 | Estándar y maduro; maneja errores de funciones `async` sin código extra |
| Pruebas backend | Vitest | Funciona con TypeScript sin configuración extra |
| Renderizado | Angular SSR (`@angular/ssr`) en portada y artículos | Buscadores y redes sociales reciben el HTML completo sin ejecutar JavaScript (spec.md, decisión G) |
| Contenido | Markdown en `content/articulos/` + script de carga | Formato estándar para escribir; no hace falta un editor en la aplicación todavía (spec.md, pregunta 8) |
| Categorías | Lista fija gestionada por el autor en `/cuenta/categorias` | Una sola fuente de verdad: el script de carga no crea categorías ni pisa las asignaciones hechas en la interfaz (spec.md, decisiones I y J) |
| Rutas del autor | Agrupadas en `/api/v1/author/*` | Un solo router exige la sesión para todas; las rutas públicas no cambian |
| Estilos | CSS propio, BEM y mobile first; sin frameworks de CSS | Control total del diseño y de la accesibilidad, sin peso extra |
| Viaje de la experiencia | CSS 3D propio: cada diorama es una lista de cubos (datos en `presentation/journey/scenes.ts`) dibujados por un único CSS genérico | Sin WebGL ni librerías (+5 kB comprimidos para todo); el texto real queda en la página para lectores de pantalla y SEO (spec.md, HU-20) |
| Fondo animado | Canvas 2D propio con `import()` diferido (4,5 kB); sonido con Web Audio | Sustituye a three.js (750 kB): pesa casi nada, no necesita WebGL y cuenta algo del autor (spec.md, HU-19) |
| Idiomas | Diccionarios tipados propios + `I18nService` (señales); cookie `lang` | Cambio instantáneo sin recargar y sin librerías; el compilador garantiza que el inglés tiene todos los textos (spec.md, HU-18 y decisión M) |
| Perfil bilingüe | `content/perfil/perfil.json` + `load:profile`; columnas `*_en` | Dos idiomas fijos: una columna por idioma es más simple que una tabla de traducciones |
| LinkedIn | Exportación oficial + `load:linkedin` | No hay API pública y extraer datos de la web incumple sus condiciones (spec.md, decisión K) |
| GitHub | API REST desde el backend, caché de 1 h | Sin token en el navegador; tolera caídas de GitHub (decisión L) |
| Imágenes | Archivos locales con URL base configurable (`IMAGE_BASE_URL`) | Simple ahora; pasar a un CDN solo cambia esa URL (spec.md, decisión H) |

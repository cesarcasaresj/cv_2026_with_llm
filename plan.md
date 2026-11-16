# Plan de implementación

## Estado actual (15-11-2026)
- Documentación de gobernanza lista: [constitution.md](./constitution.md), [architecture.md](./architecture.md), [references.md](./references.md).
- Contrato inicial en [contracts/openapi.yaml](./contracts/openapi.yaml) (reemplaza a `proto/posts.proto`, que se puede borrar).
- Infraestructura local definida: `docker-compose.yml`, `.env.example`, `.vault/seed.sh`, `backend/db/init/`.
- Fase 1 sin Docker: PostgreSQL 18 nativo (base `cv_app`) y Vault en modo dev. Arranque reproducible con `.\dev-up.ps1` (carga las credenciales y levanta el backend).
- Fase 2 (backend): `npm run generate:api` genera los tipos desde el contrato.
- Fase 3 (backend) completa: `GET http://localhost:8081/api/v1/posts/count` devuelve `total: 2`. El puerto 8080 lo ocupa otro servicio local, por eso se usa 8081 (en `.env`).
- Fase 4 (frontend) en curso: Angular 22 zoneless con `PostCounter` (`httpResource`), proxy a `localhost:8081`, Storybook con stories Éxito/Cargando/ConError y `addon-a11y`. Build y proxy verificados. A11y verificado con axe (mismo motor que el panel A11y de Storybook) en todas las stories: sin violaciones.
- Nota: `frontend/.npmrc` activa `legacy-peer-deps` porque `openapi-typescript` 7 pide TypeScript 5 y Angular 22 usa TypeScript 6.
- Fase 5 (autenticación) en curso: contrato (login, logout, me), tabla `users` y `sessions`, scrypt para contraseñas, JWT con la clave en Vault (`secret/cv-app/jwt`, se genera sola en `dev-up.ps1`), cookie HttpOnly y logout que revoca la sesión en el servidor. Backend probado con curl y con `frontend/` vía proxy: login, me, logout y errores. Cuenta del autor: `npm run create:user -- correo` con `AUTHOR_PASSWORD` en el entorno. Verificado en Chrome (headless): guard de `/cuenta`, título y foco en `<main>` al cambiar de ruta, login, error de credenciales, cookie no visible desde JavaScript, logout, y axe sin violaciones en todas las páginas.
- Fase 6 (artículos, HU-06, HU-07 y HU-10 a HU-13) implementada:
  - **Contrato 1.3.0:** artículo completo (`GET /api/v1/posts/{slug}`), etiquetas (`GET /api/v1/tags`), filtros combinables `?category=&tag=`, `sitemap.xml` y `robots.txt`.
  - **Base:** migración `005_articles.sql` con la anatomía de §5.1 y reglas en la base (un artículo publicado exige descripción de 50 a 160 caracteres, cuerpo, autor y fecha; la portada exige tamaño y `alt` salvo que sea decorativa).
  - **Contenido:** archivos Markdown en `content/articulos/` y `npm run load:content -- --author correo` (valida todo antes de escribir y genera portadas AVIF/WebP/JPG con `sharp`).
  - **Frontend con SSR** (`@angular/ssr`): portada y artículos renderizados en el servidor; login y cuenta en el navegador. `SeoService` gestiona title, description, canonical, Open Graph, Twitter y JSON-LD `BlogPosting`. Un artículo inexistente responde 404 real con `noindex`. Filtros en la URL (`/?categoria=…&etiqueta=…`) y enlace "Saltar al contenido".
  - **Verificado:** 38 pruebas del backend; 32 comprobaciones del HTML que recibe un robot sin JavaScript (en producción y en `npm start`); 59 comprobaciones en Chrome, incluido axe sin violaciones en todas las páginas y en las 27 stories.
  - Los artículos de ejemplo están a nombre de una cuenta temporal (`autor@example.com`, "Autor de ejemplo"): al crear la cuenta real, volver a ejecutar `load:content` con ese correo.
- Fase 6, HU-08 y HU-09 (rama `feat/hu-08-09-categorias`) implementadas:
  - **Decisión:** categorías como lista fija (spec.md, pregunta 2). Solo el autor las crea, renombra y borra en `/cuenta/categorias`; `load:content` ya no las crea y solo usa la del archivo al cargar un artículo nuevo (decisiones I y J).
  - **Contrato 1.4.0:** rutas del autor bajo `/api/v1/author/` (categorías y categoría de cada artículo), todas con sesión.
  - **Verificado:** 65 pruebas del backend; 23 comprobaciones de la API real (401, 404, 409, 422 y cambios en la base); 45 comprobaciones en Chrome de la nueva página (teclado, foco, anuncios, móvil y axe en la página y en las 12 stories nuevas); sin regresiones en el recorrido anterior (71/71) ni en el SSR (32/32).
- Producción del frontend: `node dist/frontend/server/server.mjs` con `PORT`, `BACKEND_URL`, `PUBLIC_SITE_URL` y `ALLOWED_HOSTS` (dominios aceptados por la protección SSRF de Angular).

## Decisiones tomadas
| Tema | Decisión |
|---|---|
| Comunicación | REST/JSON con contrato OpenAPI 3.1 |
| Base de datos | PostgreSQL 17 (Docker en local) |
| Secretos | HashiCorp Vault (modo dev en local, AppRole en producción) |
| Backend | Node.js + TypeScript + Express 5 + `pg` + Vitest |
| Frontend | Angular zoneless + `httpResource` + Storybook + `@angular/cdk/a11y` |
| Sesión | JWT en cookie `HttpOnly; Secure; SameSite=Strict`, clave de firma en Vault |

## Decisiones pendientes
- [x] **Especificación funcional (`spec.md`)**: borrador escrito (HU-01 a HU-05 con criterios). Quedan 4 preguntas abiertas en `spec.md` §6; la 1 y la 2 bloquean la Fase 6 y el alta de usuarios de la Fase 5.
- [ ] Versión exacta de Angular y de Node (fijar las estables al hacer el scaffold).
- [ ] Dónde se desplegará (define el método de autenticación con Vault en producción).

---

## Fase 0 — Especificación
**Entregable:** `spec.md` con historias de usuario y criterios de aceptación.
**Listo cuando:** cada historia tiene al menos un criterio verificable y se sabe qué endpoints necesita.

## Fase 1 — Infraestructura local
**Tareas:** copiar `.env.example` a `.env`, ejecutar `docker compose up -d`.
**Listo cuando:**
- `docker compose ps` muestra `postgres` y `vault` saludables.
- `vault kv get secret/cv-app/database` (con `VAULT_ADDR` y `VAULT_TOKEN` del `.env`) devuelve las credenciales.
- La tabla `posts` existe con los datos de ejemplo.

## Fase 2 — Contrato y generación de tipos
**Tareas:** agregar `openapi-typescript` en backend y frontend con el script `generate:api`.
**Listo cuando:** `npm run generate:api` crea `backend/src/generated/api.ts` y `frontend/src/app/core/api/generated.ts` sin errores.

## Fase 3 — Backend: contador de publicaciones (primer flujo completo)
**Tareas:** scaffold de `backend/` (TypeScript, Express 5, `pg`, Vitest) e implementar las piezas de `references.md` §1.
**Listo cuando:**
- `npm test` pasa (prueba de `GetTotalPostsCount`).
- `GET http://localhost:8080/api/v1/posts/count` devuelve `{ "total": 2, "lastUpdated": "..." }`.
- Con Vault apagado, el backend falla al arrancar con un mensaje claro y sin mostrar secretos.

## Fase 4 — Frontend: PostCounter y Storybook
**Tareas:** scaffold de Angular zoneless, Storybook con `@storybook/addon-a11y`, `proxy.conf.json` y el componente de `references.md` §2.
**Listo cuando:**
- Las stories Éxito, Cargando y ConError se ven correctamente y el panel A11y no reporta violaciones.
- Con `npm start`, la página muestra el total real que viene del backend.
- Se cumple el DoD de `constitution.md`.

## Fase 5 — Autenticación
**Tareas:**
- Agregar al contrato `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` y `GET /api/v1/auth/me`.
- Tabla `users` con contraseñas hasheadas (argon2 o bcrypt).
- Clave de firma del JWT en Vault (`secret/cv-app/jwt`).
- El backend entrega el JWT en cookie `HttpOnly`; el frontend consulta `/auth/me` y protege rutas con un guard.
**Listo cuando:** se puede iniciar y cerrar sesión, el token no es visible desde JavaScript del navegador y una ruta protegida redirige al login sin sesión.

## Fase 6 — Funcionalidades del `spec.md`
Repetir el ciclo de `references.md` (contrato → backend → frontend → stories) para cada historia.

## Fase 7 — Calidad continua
**Tareas:** ESLint y Prettier en ambos proyectos; integración continua (por ejemplo GitHub Actions) que ejecute lint, pruebas, build y las pruebas de Storybook.
**Listo cuando:** un PR que rompa una prueba o una regla A11y no se puede fusionar.

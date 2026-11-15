# Especificación funcional

> Estado: **borrador**. Historias HU-01 a HU-05 (contador y autenticación), HU-06 a HU-09 (categorías) y HU-10 a HU-13 (artículo completo, etiquetas, SEO y accesibilidad). Las decisiones sin confirmar están en §7 y las preguntas abiertas en §8. Las decisiones G y H y las preguntas 6 a 8 ya están resueltas.

## 1. Propósito

Muestra de arquitectura para un CV: una aplicación web con backend desacoplado, secretos en Vault, contrato OpenAPI y componentes accesibles. La funcionalidad es deliberadamente pequeña para que lo importante sea la arquitectura.

## 2. Usuarios

| Usuario | Descripción | Puede |
|---|---|---|
| Visitante | Cualquier persona que abre la aplicación, sin cuenta | Ver el total de publicaciones, ver las categorías con sus publicaciones, filtrar por categoría o etiqueta y leer cada artículo completo |
| Buscador / red social | Robots de Google, Bing, LinkedIn, etc. | Leer el título, la descripción, la imagen y los datos estructurados de cada artículo (HU-12) |
| Autor | Dueño del CV, con cuenta creada previamente | Todo lo del visitante, más iniciar y cerrar sesión, asignar la categoría de sus publicaciones y gestionar la lista de categorías |

No hay registro público: la cuenta del autor se crea con un script de línea de comandos (ver §8, punto 3).

---

## 3. Historias de usuario

### HU-01: Ver el total de publicaciones (visitante)
**Como** visitante, **quiero** ver cuántas publicaciones hay, **para** tener una idea del contenido disponible.

**Endpoint:** `GET /api/v1/posts/count`

Criterios de aceptación:
- [ ] Al abrir la página, el contador muestra el valor real devuelto por el backend (en desarrollo, `2`). Solo cuenta artículos publicados, no borradores (decisión F).
- [ ] Mientras carga, se muestra un estado de carga y el lector de pantalla anuncia "Cargando el total de publicaciones".
- [ ] Si la petición falla, se muestra "No pudimos cargar el total…" y **nunca** un `0`.
- [ ] Si no hay publicaciones, el backend devuelve `total: 0` y la página muestra `0` (es un dato válido, no un error).
- [ ] La respuesta cumple `PostCountResponse` de `contracts/openapi.yaml`.

### HU-02: Iniciar sesión (autor)
**Como** autor, **quiero** iniciar sesión con mi correo y contraseña, **para** acceder a las secciones protegidas.

**Endpoint:** `POST /api/v1/auth/login` (por añadir al contrato en la Fase 5)

Criterios de aceptación:
- [ ] Con credenciales válidas, el backend responde 200 y entrega el JWT en una cookie `HttpOnly; Secure; SameSite=Strict`.
- [ ] Con credenciales inválidas, responde con un `ApiError` y el mensaje "Correo o contraseña incorrectos", sin revelar cuál de los dos campos falló.
- [ ] La contraseña se guarda hasheada con scrypt (módulo `crypto` de Node, sin dependencias extra) en la tabla `users`.
- [ ] El token no es accesible desde JavaScript (`document.cookie` no lo muestra).
- [ ] La clave de firma del JWT se lee de Vault (`secret/cv-app/jwt`).

### HU-03: Cerrar sesión (autor)
**Como** autor, **quiero** cerrar sesión, **para** que nadie más use mi cuenta en ese navegador.

**Endpoint:** `POST /api/v1/auth/logout`

Criterios de aceptación:
- [ ] Responde 204 y borra la cookie de sesión.
- [ ] La sesión queda revocada en la tabla `sessions`: `GET /api/v1/auth/me` responde 401 incluso si alguien conserva una copia del token.

### HU-04: Conocer la sesión actual (autor)
**Como** autor, **quiero** que la aplicación sepa si tengo sesión, **para** mostrar la interfaz correcta.

**Endpoint:** `GET /api/v1/auth/me`

Criterios de aceptación:
- [ ] Con sesión válida, responde 200 con `{ id, email }` (sin el hash de la contraseña).
- [ ] Sin sesión o con token vencido, responde 401 con `ApiError`.

### HU-05: Proteger una ruta (autor)
**Como** autor, **quiero** que una página privada me lleve al login si no tengo sesión, **para** no ver contenido restringido.

Criterios de aceptación:
- [ ] Sin sesión, al entrar a una ruta protegida la aplicación redirige a la página de login.
- [ ] Después de iniciar sesión, vuelve a la ruta que pedí originalmente.
- [ ] El foco se mueve al `<h1>` de la página de login, y el `<title>` del documento cambia.

### HU-06: Ver las categorías y sus publicaciones (visitante)
**Como** visitante, **quiero** ver las categorías y, dentro de cada una, sus publicaciones, **para** saber qué temas hay antes de filtrar.

**Endpoints:** `GET /api/v1/categories` (lista) y `GET /api/v1/categories/{id}` (detalle con sus publicaciones) (por añadir al contrato)

Criterios de aceptación:
- [ ] La lista muestra el nombre, el `slug` y el número de publicaciones de cada categoría.
- [ ] El detalle de una categoría incluye el `id` y el título de cada una de sus publicaciones.
- [ ] Solo aparecen en la lista las categorías con al menos una publicación (decisión: ver §7, punto A).
- [ ] La lista se ordena alfabéticamente por nombre.
- [ ] Si no hay categorías, la página muestra "Todavía no hay categorías" (no un estado de error).
- [ ] Un `id` de categoría inexistente responde 404 con `ApiError`.

### HU-07: Filtrar publicaciones por categoría (visitante)
**Como** visitante, **quiero** elegir una categoría y ver solo sus publicaciones, **para** encontrar los temas que me interesan.

**Endpoint:** `GET /api/v1/posts?category={slug}` (por añadir al contrato)

Criterios de aceptación:
- [ ] Con una categoría elegida, la lista muestra solo las publicaciones que la tienen asignada.
- [ ] Cada publicación aparece en una sola categoría: la que tiene asignada.
- [ ] Si la categoría no existe, responde 404 con `ApiError` (no una lista vacía).
- [ ] Al cambiar de categoría, el anuncio de accesibilidad indica cuántas publicaciones hay en ella.

### HU-08: Asignar la categoría de una publicación (autor)
**Como** autor, **quiero** asignar a cada publicación su categoría, **para** que los visitantes la encuentren al filtrar.

**Endpoint:** `PUT /api/v1/posts/{id}/category` (requiere sesión; por añadir al contrato), con `{ "categoryId": n }`

Criterios de aceptación:
- [ ] La publicación tiene exactamente una categoría: cambiarla la mueve a la nueva y la quita de la anterior.
- [ ] Una publicación sin categoría no es válida (decisión: ver §7, punto B). Enviar `categoryId` vacío responde 422 con `ApiError`.
- [ ] Un `categoryId` inexistente responde 422 con `ApiError`, sin cambiar nada.
- [ ] Sin sesión, responde 401.

### HU-09: Crear, renombrar y borrar categorías (autor)
**Como** autor, **quiero** gestionar la lista de categorías, **para** mantenerla ordenada sin tocar la base de datos.

**Endpoints:** `POST /api/v1/categories`, `PATCH /api/v1/categories/{id}`, `DELETE /api/v1/categories/{id}` (requieren sesión; por añadir al contrato)

Criterios de aceptación:
- [ ] El nombre es obligatorio, tiene entre 2 y 40 caracteres y se guarda sin espacios sobrantes.
- [ ] Los nombres son únicos sin distinguir mayúsculas: crear "Diseño" si ya existe "diseño" responde 409 con `ApiError`.
- [ ] Renombrar una categoría cambia el nombre en todas sus publicaciones, sin tocar las asignaciones.
- [ ] Borrar una categoría sin publicaciones la elimina; si tiene publicaciones, responde 409 y no la borra (decisión: ver §7, punto C).

### HU-10: Leer un artículo completo (visitante)
**Como** visitante, **quiero** abrir una publicación y leer el artículo completo, **para** conocer el trabajo del autor en detalle.

**Ruta:** `/articulos/{slug}` · **Endpoint:** `GET /api/v1/posts/{slug}` (por añadir al contrato)

Una publicación es un **artículo** (pregunta 1 resuelta). Sus partes están en §5.1.

Criterios de aceptación:
- [ ] La página muestra, dentro de un `<article>`: el título como único `<h1>`, la descripción (entradilla), el autor, la fecha de publicación y la de actualización, el tiempo de lectura, la categoría, las etiquetas, la imagen de portada y el cuerpo.
- [ ] Desde la lista de publicaciones (HU-06 y HU-07), cada título es un enlace a su artículo.
- [ ] La categoría y cada etiqueta son enlaces a su lista filtrada.
- [ ] Solo se muestran artículos publicados. Un borrador o un slug inexistente responde 404 con `ApiError`, y la página muestra "No encontramos este artículo" con un enlace a la portada (nunca una pantalla en blanco).
- [ ] El cuerpo llega como HTML ya convertido desde Markdown y saneado: no puede ejecutar scripts (decisión D).
- [ ] El tiempo de lectura se calcula del cuerpo (unas 200 palabras por minuto) y se muestra como "Lectura de N minutos".

### HU-11: Clasificar con etiquetas (visitante)
**Como** visitante, **quiero** ver las etiquetas de los artículos y filtrar por ellas, **para** encontrar temas concretos que cruzan varias categorías.

**Endpoints:** `GET /api/v1/tags` y `GET /api/v1/posts?tag={slug}` (por añadir al contrato)

La taxonomía tiene dos niveles: **categoría** (una por artículo, obligatoria, el tema principal) y **etiquetas** (de 0 a 10 por artículo, los temas secundarios).

Criterios de aceptación:
- [ ] Un artículo puede tener de 0 a 10 etiquetas, y una etiqueta puede estar en muchos artículos (decisión E).
- [ ] La lista de etiquetas muestra el nombre y el número de artículos publicados, solo para las que tienen al menos uno, ordenadas por nombre.
- [ ] Filtrar por etiqueta funciona igual que por categoría: una etiqueta inexistente responde 404.
- [ ] Los dos filtros se pueden combinar (`?category=diseno&tag=accesibilidad` devuelve los artículos que cumplen ambos).
- [ ] Los nombres de etiqueta son únicos sin distinguir mayúsculas, como las categorías.

### HU-12: SEO de cada artículo (buscadores y redes sociales)
**Como** autor, **quiero** que cada artículo tenga la información que leen buscadores y redes sociales, **para** que aparezca bien en resultados y al compartirlo.

Criterios de aceptación:
- [ ] `<title>`: `{seoTitle o título} · CV 2026`. Se recomienda que no pase de 60 caracteres; `seoTitle` es opcional y sirve para acortar un título largo.
- [ ] `<meta name="description">` con la descripción del artículo, obligatoria al publicar, de 50 a 160 caracteres.
- [ ] `<link rel="canonical">` con la URL absoluta del artículo.
- [ ] Open Graph: `og:type=article`, `og:title`, `og:description`, `og:url`, `og:image` (portada), `og:image:alt`, `og:locale=es_ES`, `article:published_time`, `article:modified_time`, `article:section` (categoría) y un `article:tag` por etiqueta. Twitter: `twitter:card=summary_large_image`.
- [ ] Datos estructurados JSON-LD de schema.org `BlogPosting`: `headline`, `description`, `image`, `datePublished`, `dateModified`, `author` (`Person`), `articleSection`, `keywords`, `inLanguage: "es"` y `mainEntityOfPage`.
- [ ] `GET /sitemap.xml` lista todos los artículos publicados con `lastmod` = fecha de actualización, y `robots.txt` lo enlaza.
- [ ] El slug no cambia después de publicar, aunque cambie el título, para no romper enlaces ni posiciones en buscadores.
- [ ] La portada declara `width` y `height` para que la página no salte al cargar (Core Web Vitals).
- [ ] El HTML que recibe un robot ya incluye el título, las etiquetas meta y el contenido, sin depender de ejecutar JavaScript (decisión G, pendiente de confirmar).

### HU-13: Accesibilidad del artículo (visitante)
**Como** visitante que usa lector de pantalla, teclado o zoom, **quiero** que el artículo sea fácil de recorrer y leer, **para** entenderlo igual que cualquier otra persona.

Criterios de aceptación:
- [ ] Un solo `<h1>` por página (el título). Los encabezados del cuerpo empiezan en `<h2>` y no saltan niveles: un `#` en el Markdown se convierte en `<h2>` (decisión D).
- [ ] La portada y toda imagen informativa del cuerpo tienen `alt` descriptivo; las decorativas usan `alt=""`. Al publicar, la portada debe tener `alt` o estar marcada como decorativa.
- [ ] Las imágenes se sirven con `<picture>`: AVIF, WebP y un formato heredado como respaldo (constitución §9).
- [ ] Fechas en `<time datetime="…">` con texto en español ("15 de noviembre de 2026").
- [ ] Los enlaces del cuerpo tienen texto que se entiende fuera de contexto (nada de "haz clic aquí").
- [ ] La categoría y las etiquetas forman una lista de enlaces con un nombre accesible ("Etiquetas del artículo").
- [ ] Ancho de línea cómodo (máximo unos 70 caracteres) y contraste de al menos 4.5:1 en el texto.
- [ ] Cada página empieza con un enlace "Saltar al contenido" que lleva el foco al `<main>`.
- [ ] axe no reporta violaciones en la página del artículo ni en sus stories (éxito, carga, error y "no encontrado").

---

## 4. Requisitos transversales

Se aplican a todas las historias, según `constitution.md`:
- **Errores:** toda respuesta de error usa `ApiError` (`code`, `message`, `timestamp`), sin trazas ni SQL.
- **Accesibilidad:** navegación por teclado, estados anunciados con `aria-live`, HTML semántico, documento en español (`lang="es"`).
- **SEO:** toda página pública tiene `<title>` y `<meta name="description">` propios; los artículos cumplen además la HU-12.
- **Secretos:** ninguna credencial sale del backend ni llega al navegador.
- **Pruebas:** cada caso de uso tiene su `.spec.ts`; cada componente tiene stories de éxito, carga y error.

## 5. Modelo de datos (mínimo)

| Tabla | Campos | Notas |
|---|---|---|
| `categories` | `id`, `name` (único, sin distinguir mayúsculas), `slug` | `slug` se usa en la URL del filtro (`?category=diseno`) |
| `posts` | ver §5.1 | `category_id` es obligatorio y apunta a `categories.id`: un artículo tiene una sola categoría y una categoría tiene muchos artículos |
| `tags` | `id`, `name` (único, sin distinguir mayúsculas), `slug` | Etiquetas libres (HU-11) |
| `post_tags` | `post_id`, `tag_id` | Muchos a muchos: un artículo tiene de 0 a 10 etiquetas |
| `users` | `id`, `email` (único), `password_hash` | Fase 5. Solo hay cuenta del autor, creada con `npm run create:user` |
| `sessions` | `id` (UUID), `user_id`, `expires_at`, `revoked_at` | Fase 5. Cada JWT lleva el `id` de su sesión; el logout la revoca en el servidor |

La categoría "lleva" sus publicaciones por la relación inversa: `categories.id` ↔ `posts.category_id`. No hace falta una tabla intermedia.

### 5.1 Anatomía de un artículo (`posts`)

| Campo | Obligatorio | Uso | Regla |
|---|---|---|---|
| `id` | sí | Identificador interno | — |
| `slug` | sí | URL `/articulos/{slug}` y canonical | Único, minúsculas y guiones; no cambia tras publicar |
| `title` | sí | `<h1>`, `og:title`, `headline` | 10 a 110 caracteres |
| `seo_title` | no | `<title>` cuando el título es largo | Máximo 60 caracteres |
| `description` | sí al publicar | Entradilla, `meta description`, `og:description` | 50 a 160 caracteres |
| `body_markdown` | sí al publicar | Cuerpo del artículo | Markdown; `#` se convierte en `<h2>` |
| `cover_image_path` | no | Portada, `og:image` | Ruta a la imagen; se sirve en AVIF/WebP/respaldo |
| `cover_image_alt` | si hay portada | `alt`, `og:image:alt` | Vacío solo si `cover_is_decorative` |
| `cover_is_decorative` | no | Portada sin información | Por defecto `false` |
| `cover_width`, `cover_height` | si hay portada | Evitar saltos de diseño | Píxeles |
| `author_id` | sí | Autor (`users.id`), JSON-LD `author` | — |
| `category_id` | sí | Taxonomía principal | Ver HU-08 |
| `status` | sí | `draft` o `published` | Solo `published` es público |
| `published_at` | al publicar | Fecha visible, `datePublished` | — |
| `updated_at` | sí | Fecha de actualización, `dateModified`, `lastmod` | Cambia en cada edición |
| `created_at` | sí | Auditoría | — |

Calculados (no se guardan): tiempo de lectura, URL canónica, HTML del cuerpo.

El autor necesita un nombre visible para el artículo y el JSON-LD: se añade `display_name` a `users`.

## 6. Fuera de alcance (por ahora)

- Crear, editar o borrar artículos desde la interfaz (solo se asignan categorías). Mientras tanto, los artículos se cargan con SQL (ver pregunta 8).
- Registro público de usuarios.
- Recuperación de contraseña.
- Jerarquía de categorías (subcategorías).
- Comentarios, búsqueda de texto y RSS.

## 7. Decisiones tomadas sin confirmar

Las tomé para poder escribir las historias. Si alguna no te gusta, dímelo y ajusto el spec antes de tocar el contrato.

- **A.** Los visitantes solo ven categorías con al menos una publicación, para no mostrar listas vacías.
- **B.** Cada publicación tiene exactamente una categoría y es obligatoria. Las dos publicaciones de ejemplo que ya existen necesitarán una categoría al migrar la tabla.
- **C.** Borrar una categoría en uso está bloqueado: obliga al autor a reasignar antes, en lugar de dejar publicaciones sin clasificar sin avisar.
- **D.** El cuerpo se escribe en Markdown. El backend lo convierte a HTML con la biblioteca `marked` y baja un nivel los encabezados (`#` → `<h2>`), y el frontend lo pinta con el saneador nativo de Angular (`[innerHTML]`), que elimina scripts. Markdown es el formato estándar para escribir artículos y evita guardar HTML a mano.
- **E.** Las etiquetas son libres (las crea el autor) y cada artículo tiene como máximo 10, para que sigan siendo útiles como filtro.
- **F.** Los artículos tienen dos estados: `draft` (borrador) y `published`. El visitante, el contador, las listas y el sitemap solo ven los publicados.
- **G. (confirmada)** Las páginas públicas (portada y artículos) se entregan renderizadas en el servidor con **Angular SSR** (`@angular/ssr`). Login y "Mi cuenta" siguen renderizándose en el navegador: dependen de la cookie de sesión y no aportan nada al SEO.
- **H. (confirmada)** Las imágenes viven como archivos en `frontend/public/images/articulos/`. El script de carga genera AVIF, WebP y JPG desde la imagen original con `sharp` y guarda ancho y alto. Todas las rutas pasan por una URL base configurable: si más adelante se usa un CDN (Cloudinary, S3 + CloudFront), solo cambia esa URL.

## 8. Preguntas abiertas

1. ~~**¿Qué es una "publicación"?**~~ **Resuelta:** es un artículo completo, con taxonomía (categoría y etiquetas), SEO y accesibilidad (HU-10 a HU-13, §5.1).
2. **¿Las categorías las defines tú (lista cerrada) o las creas libremente?** La HU-09 asume que el autor las crea. Si es una lista fija, la HU-09 se reduce a solo lectura.
3. ~~**¿Cómo se crea la cuenta del autor?**~~ **Resuelta (Fase 5):** con el script `npm run create:user -- correo`, que lee la contraseña de la variable `AUTHOR_PASSWORD`. Puede confirmarse o cambiarse más adelante.
4. ~~**¿Qué ve el visitante además del contador y las categorías?**~~ **Resuelta:** los artículos completos (HU-10) y sus etiquetas (HU-11).
5. **¿Dónde se despliega?** Define si el login usa Vault con AppRole o con otro método (ver `plan.md`, decisiones pendientes), y también dónde corre el servidor de SSR (decisión G).
6. ~~**¿SSR o prerender?**~~ **Resuelta:** SSR (decisión G).
7. ~~**¿Dónde viven las imágenes?**~~ **Resuelta:** archivos locales con URL base configurable (decisión H).
8. ~~**¿Cómo se escriben los artículos?**~~ **Resuelta:** archivos Markdown en `content/articulos/*.md`, con sus datos al inicio (front matter), y el script `npm run load:content -- --author correo` que los carga en la base. El nombre del archivo es el slug. Un editor dentro de la aplicación sería una fase aparte.

# Especificación funcional

> Estado: **borrador**. Historias HU-01 a HU-05 (contador y autenticación), HU-06 a HU-09 (categorías) y HU-10 a HU-13 (artículo completo, etiquetas, SEO y accesibilidad). Las decisiones sin confirmar están en §7 y las preguntas abiertas en §8. Las decisiones G y H y las preguntas 2 y 6 a 8 ya están resueltas. HU-08 y HU-09 están implementadas (decisiones I y J).

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

**Ruta:** `/cuenta/categorias` · **Endpoints:** `GET /api/v1/author/posts` (todos los artículos, borradores incluidos) y `PUT /api/v1/author/posts/{id}/category` con `{ "categoryId": n }`. Requieren sesión.

Criterios de aceptación:
- [x] La publicación tiene exactamente una categoría: cambiarla la mueve a la nueva y la quita de la anterior.
- [x] Una publicación sin categoría no es válida (decisión: ver §7, punto B). Enviar `categoryId` vacío responde 422 con `ApiError`.
- [x] Un `categoryId` inexistente responde 422 con `ApiError`, sin cambiar nada. Un artículo inexistente responde 404.
- [x] Sin sesión, responde 401.
- [x] Elegir una categoría en la lista no guarda nada; el cambio se aplica con "Guardar" (WCAG 3.2.2) y se anuncia al lector de pantalla.
- [x] La categoría asignada aquí manda sobre la del archivo Markdown: `load:content` solo la usa al cargar un artículo por primera vez (decisión I).

### HU-09: Crear, renombrar y borrar categorías (autor)
**Como** autor, **quiero** gestionar la lista de categorías, **para** mantenerla ordenada sin tocar la base de datos.

Las categorías son una **lista fija** (pregunta 2): solo cambian desde esta pantalla. El script de carga nunca las crea.

**Ruta:** `/cuenta/categorias` · **Endpoints:** `GET` y `POST /api/v1/author/categories`, `PATCH` y `DELETE /api/v1/author/categories/{id}`. Requieren sesión.

Criterios de aceptación:
- [x] La lista del autor incluye las categorías vacías y cuenta también los borradores (la pública, HU-06, sigue mostrando solo las que tienen artículos publicados).
- [x] El nombre es obligatorio, tiene entre 2 y 40 caracteres y se guarda sin espacios sobrantes.
- [x] Los nombres son únicos sin distinguir mayúsculas: crear "Diseño" si ya existe "diseño" responde 409 con `ApiError`. También responde 409 un nombre que produce el mismo slug ("Diseno").
- [x] Renombrar una categoría cambia el nombre en todas sus publicaciones, sin tocar las asignaciones. El slug se recalcula (decisión J).
- [x] Borrar una categoría sin publicaciones la elimina; si tiene publicaciones (también borradores), responde 409 y no la borra (decisión: ver §7, punto C). La interfaz no ofrece "Borrar" en ese caso y explica por qué.
- [x] Borrar pide confirmación en la misma fila; el foco va al campo o botón correspondiente en cada paso y nunca se pierde.

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

### HU-14: Portada del portafolio (visitante)
**Como** visitante, **quiero** una portada que presente al autor de un vistazo, **para** saber quién es y qué hace antes de leer más.

**Ruta:** `/` (el blog pasa a `/blog`) · **Endpoint:** `GET /api/v1/profile`

Criterios de aceptación:
- [x] Secciones en este orden, cada una con su ancla: inicio (`#inicio`), experiencia (`#experiencia`), acerca de mí (`#sobre-mi`), proyectos (`#proyectos`) y actualidad (`#actualidad`), más un enlace final al blog.
- [x] Cabecera fija con la navegación; en móvil, el menú se desplaza en horizontal dentro de la cabecera. Al pulsar un ancla, la sección queda visible bajo la cabecera y recibe el foco.
- [x] El nombre es el único `<h1>`. La portada se renderiza en el servidor con todo su contenido y añade JSON-LD `Person` (nombre, cargo, ubicación y perfiles).
- [x] CSS propio, sin frameworks, con metodología BEM y mobile first.
- [x] Fondo animado decorativo (`aria-hidden`): el pentagrama de luz de la HU-19, en un canvas 2D que se descarga después del primer render, solo anima mientras se ve y se libera al salir. Sin canvas queda un degradado CSS.
- [x] Efectos: palabras del nombre escalonadas, aparición de secciones al hacer scroll, tarjetas con inclinación 3D, barra de progreso de lectura y transiciones entre páginas.
- [x] Con "reducir movimiento" (WCAG 2.3.3) la portada usa un modo suave: el pentagrama se mueve a un cuarto de velocidad, sin seguir al puntero, sin chispas ni corcheas que suben; las entradas y apariciones solo se funden (sin desplazarse, girar ni desenfocar); no hay inclinación 3D en las tarjetas.

### HU-15: Experiencia (visitante)
- [x] Cada puesto muestra cargo, empresa, ubicación, fechas ("mar 2023 – actualidad") y duración ("2 años y 9 meses"); el puesto actual primero. Se presenta como el viaje de la HU-20.

### HU-16: Proyectos de GitHub (visitante)
**Endpoint:** `GET /api/v1/projects`
- [x] Repositorios públicos del usuario `GITHUB_USERNAME`, sin forks ni archivados, del último actualizado al más antiguo (máximo 9).
- [x] Si algún repositorio lleva el topic `portfolio` en GitHub, solo se muestran los que lo llevan (proyectos destacados, sin prácticas de cursos); si ninguno lo lleva, se muestran todos.
- [x] El backend guarda la respuesta de GitHub una hora y, si GitHub falla, sirve la última copia; sin copia responde 503 y la portada ofrece el enlace al perfil (decisión L).

### HU-17: Actualidad (visitante)
**Endpoint:** `GET /api/v1/updates`
- [x] Las publicaciones más recientes del autor en LinkedIn (máximo 6), solo las visibles para cualquiera (decisión K).
- [x] Sin publicaciones, la sección no aparece ni en la página ni en el menú (una sección vacía resta). Si la carga falla, se queda con su mensaje de error.

### HU-18: Elegir el idioma, español o inglés (visitante)
**Como** visitante, **quiero** ver el sitio en español o en inglés, **para** leerlo en el idioma que entiendo mejor.

**Endpoint:** `GET /api/v1/profile?lang=es|en` · **Decisión:** M

Criterios de aceptación:
- [x] Un selector ES / EN en la cabecera, en todas las páginas: dos botones nativos con `aria-pressed`, operables con teclado, cuyo nombre accesible empieza por el texto visible ("ES Español").
- [x] El cambio es inmediato, sin recargar la página ni cambiar la URL, con un fundido suave de toda la página (View Transitions; sin esa API, el cambio es directo). Se anuncia "Idioma: English" / "Language: Español".
- [x] La elección se recuerda un año en la cookie `lang` (no es un secreto). Sin cookie, se usa el idioma del navegador (`Accept-Language`); si no es español ni inglés, el español.
- [x] El servidor renderiza la página ya en el idioma elegido, con `<html lang>`, `Content-Language` y `Vary: Cookie, Accept-Language`: no hay parpadeo ni errores de hidratación.
- [x] Se traduce toda la interfaz (navegación, secciones, estados de carga y error, formularios, anuncios, fechas, `<title>`, descripción y `og:locale`) y el perfil: titular, "Acerca de mí" y experiencia. Si falta la traducción de un texto del perfil, se muestra en español y la API responde `"lang": "es"`.
- [x] Los artículos, sus categorías y etiquetas, los proyectos de GitHub y las publicaciones de LinkedIn se muestran en su idioma original; el contenido en español lleva `lang="es"` (WCAG 3.1.2).
- [x] `?lang=` con un idioma que no existe responde 422 con `ApiError`.

### HU-19: La nana de las ideas (visitante)
**Como** visitante, **quiero** tocar notas en la portada y descubrir una melodía escondida, **para** que el CV se recuerde y transmita la idea del autor: "el arrullo de las ideas".

Criterios de aceptación:
- [x] Sobre el cielo de la portada ondula un pentagrama de cinco líneas de luz, más tranquilo bajo el texto; el puntero lo curva como cuerdas.
- [x] Bajo el nombre, siempre visibles, cinco notas con símbolos propios (◆ { } ⚡ </> ✦), cada una de un color y un tono de una escala pentatónica. Son `<button>` nativos con nombre accesible (Idea, Código, Chispa, Web, Sueño); con el foco dentro del teclado de notas, las teclas 1 a 5 también las tocan, de la fila de números o del teclado numérico, con Bloq Num encendido o apagado y en cualquier distribución de teclado (se lee la tecla física). Fuera de él no se captura ninguna tecla.
- [x] Cada nota aparece en el pentagrama, lanza una onda por su línea y suelta chispas; la partitura avanza hacia la izquierda y se desvanece. La nota se anuncia por su nombre.
- [x] Hay una melodía secreta de seis notas, original (no reproduce música de terceros). Seis puntos muestran cuántas notas seguidas van bien y esas notas brillan doradas; tras diez notas sin acertarla, la pista enseña cómo empieza.
- [x] Al tocarla se activa el modo fiesta: el pentagrama cambia de color, suben corcheas flotando y los colores de acento de toda la página giran despacio por el arcoíris (12 s por vuelta, sin destellos; contraste mínimo 4.9:1 en cualquier tono). Se anuncia "Melodía descubierta" y un botón termina la fiesta.
- [x] El sonido está apagado por defecto y se activa con un botón (`aria-pressed`). Es un tono de flauta sintetizado con Web Audio, sin archivos de audio ni librerías.
- [x] El juego es un extra: ningún contenido del CV queda detrás de él.

### HU-20: El viaje de la experiencia (visitante)
**Como** visitante, **quiero** recorrer la experiencia del autor como los niveles de un videojuego, **para** que su trayectoria se entienda y se recuerde.

**Endpoint:** `GET /api/v1/profile` (campo `scene` de cada puesto)

Criterios de aceptación:
- [x] Cada puesto es un nivel con su cajita 3D (diorama) hecha con CSS 3D, sin librerías: edificio, tocador, cambio de monedas, laboratorio, antena, panel publicitario, móvil, pasarela de pago o escritorio. La escena la elige el dato `scene` del puesto (`perfil.json`); sin él, el escritorio.
- [x] El mapa en isométrico se queda fijo mientras pasan las tarjetas de texto. La tarjeta que llega al centro de la pantalla activa su nivel: la cámara viaja hasta la caja, la tapa se abre, la escena surge y la nota ✦ de la portada salta encima. El camino recorrido se ilumina.
- [x] El orden va del presente al inicio. Un HUD muestra "Nivel N / total" y una barra de XP con los años acumulados; el último nivel dice "🏁 Aquí empezó todo" y ofrece volver al presente.
- [x] Se puede avanzar con el scroll, con los botones ◀ ▶, con el número de cada nivel (`aria-current="step"`) y con las flechas, Inicio y Fin cuando el foco está en esos botones. El scroll de la página nunca se captura. Al usar los botones se anuncia "Nivel N de total: cargo, empresa".
- [x] El mapa es decorativo (`aria-hidden`); todas las tarjetas están siempre en la página y en el HTML del servidor.
- [x] Si el sonido de la HU-19 está activado, cada salto pedido con los botones o el teclado suena con una nota. Hacer scroll por la página nunca suena.
- [x] Con "reducir movimiento" la cámara y la nota cambian de nivel sin viajar ni saltar, y las escenas no se animan. En móvil el mapa queda arriba y las tarjetas pasan por debajo, sin scroll horizontal.

### HU-21: Portales entre secciones y bandera del idioma (visitante)
**Como** visitante, **quiero** que cada sección se presente con una escena propia al navegar, **para** que recorrer el CV sea una experiencia que se recuerde.

Criterios de aceptación:
- [x] La cabecera muestra el nombre del autor ("Cesar Casares"), que también cierra el `<title>` de cada página.
- [x] Cada enlace del menú abre un portal 3D (three.js) de ~1,5 s con el nombre de la sección: Experiencia (túnel del tiempo con los años reales de la trayectoria), Sobre mí (una chispa que estalla y forma `</>`), Proyectos (bloques que caen y forman una ciudad), Actualidad (antena que emite ondas) y Blog (libro que suelta sus páginas).
- [x] El portal nunca bloquea la navegación: el enlace navega por debajo y el portal se disuelve al terminar. Se salta con un clic o con Esc. Sin WebGL, no se muestra.
- [x] No se abre con "reducir movimiento" ni con clics que abren otra pestaña (Ctrl, Cmd, Mayús, rueda).
- [x] three.js se descarga solo la primera vez que se abre un portal (unos 106 kB comprimidos): no pesa en la carga inicial.
- [x] Al cambiar de idioma aparece una bandera cartoon ondeando: EE. UU. para inglés y España para español. Las banderas se precargan; con "reducir movimiento" solo se funden.
- [x] El interruptor ES / EN lleva en su píldora la bandera del idioma activo, con las letras perfiladas para leerse sobre cualquier color. Al cambiar, la píldora gira en 3D, salta confeti con los colores de la bandera y aparece un saludo ("¡Hola!" / "Hello!"); la primera vez en la visita, todo más grande.
- [x] Al pulsar un enlace del menú, su texto cuenta la sección: Experiencia sube como niveles (+XP), Sobre mí nace de letras dispersas (❤), Proyectos cae como bloques ({ }), Actualidad parpadea como una señal (● EN VIVO) y Blog se escribe a máquina. Los lectores de pantalla leen el texto completo una sola vez (las letras sueltas son `aria-hidden`).
- [x] El portal queda debajo de la cabecera y la cabecera tiene su propio grupo en las transiciones de página e idioma: sus efectos se ven vivos. Ir a un ancla de la misma página no lanza la transición de página.
- [x] three.js se descarga cuando el puntero o el foco llegan al menú, para que el primer clic no se congele.
- [x] En escritorio, al pasar el ratón o llegar con el teclado a un enlace, se despliega una tarjeta con una escena animada de su sección y una frase: Experiencia (los años pasan y un maletín avanza), Sobre mí (lo que inspira al autor orbita a su alrededor: música, arte, ideas y código), Proyectos (ventanas de código que se escriben solas), Actualidad (un móvil con un feed en directo) y Blog (un lápiz que escribe). Es decorativa (`aria-hidden`).
- [x] En móvil las cinco secciones caben siempre, en columnas iguales con su icono encima del texto, sin desplazamiento horizontal.
- [x] Portal y bandera son decorativos (`aria-hidden`): la sección de destino recibe el foco y el cambio de idioma se anuncia con texto.

### HU-22: Modo oscuro (visitante)
**Como** visitante, **quiero** ver el sitio en modo oscuro o claro, **para** leer cómodo de noche o con poca luz.

Criterios de aceptación:
- [x] Sin elección guardada, el sitio sigue el tema del sistema (`prefers-color-scheme`) desde el primer pintado, sin parpadeo.
- [x] Un botón en la cabecera (sol que se convierte en luna) cambia de tema; la elección se guarda en la cookie `theme` y el servidor la usa para enviar la página ya con ese tema (`<html data-theme>`).
- [x] El nuevo tema se expande en círculo desde el botón (View Transitions); con "reducir movimiento" es un fundido; sin esa API, el cambio es inmediato.
- [x] Todos los textos mantienen contraste AA (4.5:1 o más) en los dos temas; los controles nativos y las barras de desplazamiento siguen el tema (`color-scheme`).
- [x] El botón es nativo, con nombre "Modo oscuro" / "Dark mode" y `aria-pressed`; el cambio se anuncia con texto.

### HU-23: "Acerca de mí" como pantalla de personaje (visitante)
**Como** visitante, **quiero** conocer a la persona con una presentación que se sienta como un videojuego, **para** recordar su perfil y sus logros.

Criterios de aceptación:
- [x] Una tarjeta de personaje con su retrato (recortado, sin metadatos), su nombre, su rol y una insignia con el nivel (años de experiencia). Está hecha de capas de papel (cielo, sol, ciudad, la persona y el cartel): sola se balancea de lado a lado y, con el ratón encima, se inclina hacia el puntero con paralaje entre capas. La cabeza sobresale del marco.
- [x] El texto "acerca de mí" aparece en una caja de diálogo: se escribe letra a letra al entrar en pantalla, un párrafo cada vez, con un botón nativo ▼ para avanzar (y volver a empezar al final). Todo el texto está siempre en la página, oculto solo a la vista, para lectores de pantalla y buscadores.
- [x] Las cifras (años, empresas, proyectos públicos) cuentan desde 0 al entrar en pantalla, llenan una barra de experiencia y muestran "LEVEL UP!" con su logro ("Nivel 10 alcanzado", "6.ª empresa desbloqueada"). Los proyectos públicos llevan la insignia OPEN SOURCE, un calendario de contribuciones que se enciende y el enlace a GitHub.
- [x] El HTML del servidor trae los valores finales; con "reducir movimiento" no hay balanceo, ni inclinación, ni conteo, ni máquina de escribir. Los lectores de pantalla leen solo el valor final de cada cifra. Nada suena al hacer scroll (HU-19).
- [x] Sin librerías 3D: CSS (transformaciones, `@property`) y un retrato en AVIF/WebP/PNG de pocos KB.
- [x] Una sola cifra de años en todo el sitio: años completos desde el primer puesto hasta hoy. La insignia de la tarjeta muestra esa experiencia (XP, "10+"), no un nivel: los niveles son los puestos del viaje (HU-20), cuya XP es la acumulada al terminar cada puesto (el actual, hasta hoy).

### HU-24: Pregúntale a mi CV (visitante)
**Como** reclutador, **quiero** preguntarle al CV en lenguaje natural (por ejemplo, "¿qué hizo en BBVA?"), **para** encontrar rápido lo que me interesa del perfil.
**Endpoints:** `GET /api/v1/assistant` y `POST /api/v1/assistant/questions`

Criterios de aceptación:
- [x] Un botón flotante "Pregúntale a mi CV" abre un panel de chat en la portada, con preguntas sugeridas. Solo aparece si el asistente está disponible (hay clave de la API de Claude en el servidor).
- [x] Responde Claude (`claude-opus-5-5`, esfuerzo bajo) en el idioma de la página, en texto breve y en tercera persona, usando **solo** los datos públicos del sitio: perfil, experiencia y proyectos. Si algo no está en esos datos, lo dice y sugiere contactar por LinkedIn; nunca inventa. Las preguntas ajenas al perfil profesional se redirigen con amabilidad.
- [x] La clave de la API vive solo en el backend (`SecretStore`, ruta `cv-app/anthropic`); nunca llega al navegador ni a los registros.
- [x] Límites para proteger el saldo: preguntas de 500 caracteres como máximo, 6 por conversación, 10 por visitante y hora, y un tope diario global (`ASSISTANT_DAILY_LIMIT`, 100 por defecto). Al superarlos responde 429 con un mensaje que dice cuándo volver.
- [x] Las instrucciones y los datos del CV van en un `system` estable con caché de prompts; el historial lo envía el navegador (el servidor no guarda conversaciones).
- [x] Si Claude rechaza o no responde, el visitante ve un mensaje amable (503); el detalle técnico solo queda en los registros, sin el texto de las preguntas.
- [x] Accesible: el panel se abre y se cierra con teclado (Esc), las respuestas se anuncian (`aria-live`) y el foco vuelve al botón al cerrar. Un aviso indica que las respuestas las genera IA y pueden contener errores.

### HU-25: Clima del visitante en la cabecera (visitante)
**Como** visitante, **quiero** ver el clima de donde estoy con una animación, **para** sentir que el sitio está vivo.
**Endpoint:** `GET /api/v1/weather`

Criterios de aceptación:
- [x] Un widget en la cabecera muestra una escena 3D animada (sol o luna, nubes en capas, lluvia, llovizna, nieve, niebla o tormenta) y la temperatura: °C en español y °F en inglés. Al pulsarlo, un panel da el detalle (condición y lugar).
- [x] Ubicación sin pedir permisos al entrar: la aproximada que añade Cloudflare a la petición (ciudad) o, si no hay, Lima. "Usar mi ubicación exacta" pide permiso al navegador solo si la persona lo pulsa.
- [x] Privacidad: el clima lo consulta el backend en Open-Meteo con las coordenadas redondeadas a un decimal (~10 km), nunca con la IP; no se guarda nada del visitante. El backend guarda cada punto 30 minutos y, si Open-Meteo falla, sirve la última copia.
- [x] Solo en el navegador y cargado con `@defer`: no entra en el HTML del servidor ni en la carga inicial. Con "reducir movimiento", la escena queda quieta.
- [x] Accesible: el botón dice el clima completo ("Clima: 25 °C, Parcialmente nublado, en Lima"); Esc y un clic fuera cierran el panel; el clima nuevo se anuncia. En móvil cabe en la primera fila de la cabecera.

### HU-27: Tema según la hora del visitante
- [x] Sin elección guardada, el sitio se ve en claro de 7:00 a 18:59 y en oscuro el resto, según la hora local del visitante.
- [x] El servidor usa la zona horaria que envía Cloudflare (`cf-timezone`) para que la página llegue ya con su tema, sin parpadeo; el navegador lo confirma con la hora del dispositivo y cambia solo si cae la noche con la página abierta.
- [x] La elección del visitante (botón sol / luna, cookie `theme`) siempre manda, también al recargar.
- [x] Sin zona horaria conocida, manda el modo del sistema (`prefers-color-scheme`).

---

## 4. Requisitos transversales

Se aplican a todas las historias, según `constitution.md`:
- **Errores:** toda respuesta de error usa `ApiError` (`code`, `message`, `timestamp`), sin trazas ni SQL.
- **Accesibilidad:** navegación por teclado, estados anunciados con `aria-live`, HTML semántico, documento con el idioma activo en `<html lang>` (HU-18).
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
| `profile` | una sola fila: `full_name`, `headline`, `headline_en`, `location`, `summary`, `summary_en` | HU-14 y HU-18. Lo llenan `load:profile` (español e inglés) o `load:linkedin` (solo español) |
| `positions` | `company`, `title`, `title_en`, `location`, `description`, `description_en`, `started_on`, `finished_on`, `scene` | HU-15, HU-18 y HU-20. `finished_on` nulo = puesto actual; `*_en` nulo = se muestra en español; `scene` = diorama del viaje |
| `profile_updates` | `published_at`, `text`, `url` | HU-17 |

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

- Crear, editar o borrar artículos desde la interfaz (solo se asignan categorías). Mientras tanto, los artículos se cargan desde Markdown con `load:content` (ver pregunta 8).
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
- **I.** La categoría de un artículo ya cargado la decide la aplicación (HU-08), no el archivo Markdown: `load:content` usa el `category` del archivo solo la primera vez y, si después difiere, avisa sin cambiarla. Así un cambio hecho en la interfaz no se pierde al volver a cargar.
- **J.** Renombrar una categoría recalcula su slug ("Seguridad" → "Seguridad web" pasa de `seguridad` a `seguridad-web`). Los enlaces filtrados antiguos (`/?categoria=seguridad`) dejan de funcionar; a cambio, el slug siempre coincide con el nombre. Si hace falta conservarlos, la alternativa es guardar los slugs anteriores y redirigir.
- **K.** LinkedIn no ofrece una API pública para leer perfiles ni publicaciones, y extraer los datos de su web incumple sus condiciones. El perfil, la experiencia y la actualidad se cargan con `npm run load:linkedin -- --dir <carpeta>` desde la **exportación oficial** (Ajustes → Privacidad de datos → Obtener una copia de tus datos). El script solo lee los campos públicos (nunca la fecha de nacimiento, la dirección ni el correo) y omite las publicaciones "solo para contactos". Para actualizar la portada, se exporta de nuevo y se vuelve a cargar.
- **L.** Los proyectos se leen en vivo de la API pública de GitHub desde el backend (no desde el navegador), sin token y con una caché de una hora: muy por debajo del límite de 60 peticiones por hora.
- **N. (confirmada, revisada el 2026-11-22)** Producción en un VPS propio (Contabo Cloud VPS 4) con Docker Compose: PostgreSQL, backend, frontend con SSR y Caddy (HTTPS automático), detrás de Cloudflare. Sustituye al hosting compartido de Namecheap (cPanel), más caro y con límites (sin túneles SSH ni servicios propios). Sin Vault en producción: los secretos van en `/opt/cv/.env` (`SECRETS_PROVIDER=env`), con la excepción escrita en la constitución (sección 2). Se compila y se prueba en GitHub Actions y se publica por SSH en cada cambio en `main`; las migraciones se aplican una sola vez cada una al arrancar el backend. Copia diaria de la base de datos. Guía: `DEPLOY.md`.
- **M. (confirmada)** El sitio se traduce con código propio, sin librerías ni servicios externos: dos diccionarios tipados en `frontend/src/app/core/i18n/` (el inglés no compila si le falta o le sobra una clave) y un servicio con una señal de idioma. Se descartó `@angular/localize` porque compila un sitio por idioma y no permite cambiar sin recargar. El idioma va en una cookie y la URL no cambia, así que los buscadores indexan la versión en español. El español es el idioma base de los datos: el inglés vive en columnas `*_en` opcionales.
- **H. (confirmada)** Las imágenes viven como archivos en `frontend/public/images/articulos/`. El script de carga genera AVIF, WebP y JPG desde la imagen original con `sharp` y guarda ancho y alto. Todas las rutas pasan por una URL base configurable: si más adelante se usa un CDN (Cloudinary, S3 + CloudFront), solo cambia esa URL.

## 8. Preguntas abiertas

1. ~~**¿Qué es una "publicación"?**~~ **Resuelta:** es un artículo completo, con taxonomía (categoría y etiquetas), SEO y accesibilidad (HU-10 a HU-13, §5.1).
2. ~~**¿Las categorías las defines tú (lista cerrada) o las creas libremente?**~~ **Resuelta:** lista fija. El autor la gestiona en `/cuenta/categorias` (HU-09) y en todo lo demás, incluido `load:content`, solo se elige una existente (decisión I).
3. ~~**¿Cómo se crea la cuenta del autor?**~~ **Resuelta (Fase 5):** con el script `npm run create:user -- correo`, que lee la contraseña de la variable `AUTHOR_PASSWORD`. Puede confirmarse o cambiarse más adelante.
4. ~~**¿Qué ve el visitante además del contador y las categorías?**~~ **Resuelta:** los artículos completos (HU-10) y sus etiquetas (HU-11).
5. **¿Dónde se despliega?** Define si el login usa Vault con AppRole o con otro método (ver `plan.md`, decisiones pendientes), y también dónde corre el servidor de SSR (decisión G).
6. ~~**¿SSR o prerender?**~~ **Resuelta:** SSR (decisión G).
7. ~~**¿Dónde viven las imágenes?**~~ **Resuelta:** archivos locales con URL base configurable (decisión H).
8. ~~**¿Cómo se escriben los artículos?**~~ **Resuelta:** archivos Markdown en `content/articulos/*.md`, con sus datos al inicio (front matter), y el script `npm run load:content -- --author correo` que los carga en la base. El nombre del archivo es el slug. Un editor dentro de la aplicación sería una fase aparte.

# Constitución del Proyecto y Reglas Mandatarias de Desarrollo

Esta constitución establece las leyes de gobernanza técnica, principios arquitectónicos, de diseño, de accesibilidad y de seguridad obligatorios para este proyecto. Todo cambio, refactorización o adición al código fuente debe alinearse estrictamente con los siguientes mandatos.

> **Propósito:** este repositorio es una muestra de arquitectura para un CV. Las piezas de infraestructura (Vault, contratos OpenAPI, Clean Architecture, Storybook) son parte intencional de lo que se quiere demostrar. Fuera de ellas, la regla de "no sobreingeniería" (sección 1) aplica sin excepciones.

---

## 1. Desarrollo del código, implementación y estructura

* **DRY sin trucos:** No repetir código innecesariamente. El código debe ser legible para un humano: nada de "inventos locos", ofuscación, compresión manual ni trucos de compilación.
* **No sobreingeniería:** No se aplica sobreingeniería a algo que ya está estandarizado, avalado y que funciona correctamente para lo que fue hecho. Se prefieren las herramientas nativas del framework antes que una librería adicional.
* **Todo cambio tiene una razón:** Es obligatorio justificar cada cambio con la mejora concreta que aporta (en el commit o en el PR).
* **Lógica simple y explicable:** Usar la solución más óptima y entendible posible. Si se necesita un algoritmo, debe estar escrito de forma que alguien ajeno al mundo de los algoritmos pueda leerlo, reutilizarlo y explicarlo.

## 2. Seguridad, llaves y protección de credenciales

* **Aislamiento con HashiCorp Vault:** Todas las API keys, claves y contraseñas, vengan de donde vengan, se almacenan cifradas en HashiCorp Vault. Vault es la única fuente de secretos del sistema en tiempo de ejecución.
* **Prohibición de valores literales:** En ninguna parte del proyecto se escribe, muestra o hardcodea el valor de una llave.
* **Nomenclatura y abstracción:** El entorno (`environment`) solo contiene la *ruta* o nombre del secreto en Vault (por ejemplo `VAULT_POSTS_DB_PATH=cv-app/database`), nunca su valor.
* **Blindaje del lado del cliente:** Ningún secreto viaja al navegador. El frontend solo habla con nuestro backend, y el backend es el único que conoce y usa las llaves (patrón Backend-for-Frontend).
* **Sesión segura:** La autenticación usa un JWT entregado en una cookie `HttpOnly; Secure; SameSite=Strict`. Está prohibido guardar tokens en `localStorage`, `sessionStorage` o en memoria accesible desde JavaScript. La clave de firma del JWT vive en Vault.
* **Excepción única para desarrollo local:** Para arrancar los contenedores se permite un archivo `.env` local con el token de desarrollo de Vault y las credenciales iniciales de PostgreSQL. Este archivo **nunca** se sube a git (está en `.gitignore`); en el repositorio solo existe `.env.example` con valores de ejemplo. En producción, el backend se autentica ante Vault con AppRole u otro método equivalente, nunca con un token fijo.

## 3. Contratos de API (REST/JSON + OpenAPI)

* **Fuente de verdad:** La comunicación frontend ↔ backend es REST/JSON. El contrato vive en `contracts/openapi.yaml` (OpenAPI 3.1) y manda sobre el código: primero se cambia el contrato, después la implementación.
* **Tipos generados:** Los tipos TypeScript de ambos lados se generan desde el contrato (`openapi-typescript`). No se escriben a mano interfaces que dupliquen el contrato.
* **Versionado:** Todas las rutas van bajo `/api/v1/`. Un cambio que rompa la compatibilidad crea `/api/v2/`.
* **Errores uniformes:** Todo error devuelve el esquema `ApiError` (`code`, `message`, `timestamp`). `message` es un texto amigable para el usuario; jamás incluye trazas, SQL ni detalles de infraestructura.

## 4. Gestión eficiente de eventos y manipulación del DOM

* **Sin Shadow DOM:** Queda prohibido `ViewEncapsulation.ShadowDom`. Se usa la encapsulación por defecto de Angular (`Emulated`).
* **Referencias nativas:** Para interactuar con elementos se usan referencias directas del framework (`viewChild()`, template refs) en lugar de abstracciones artificiales sobre los nodos.
* **Eventos trazables:** La propagación de eventos (*event bubbling*) debe ser directa y auditable desde el DOM global, sin bloqueos de encapsulamiento.

## 5. Componentes, Atomic Design y Storybook

* **Patrones solo si hacen falta:** Se aplican patrones de diseño cuando resuelven un problema real. No se rompe la arquitectura (Clean Architecture en backend, Atomic Design en frontend) por capricho.
* **Storybook obligatorio:** Todo componente nuevo o modificado tiene su archivo `.stories.ts` con, como mínimo, los estados **éxito**, **carga** y **error**. Las stories usan datos simulados y nunca llaman al backend real.
* **Cambios en el componente base:** Un cambio visual o de comportamiento se hace en el componente del Design System, de forma que afecte a todos sus usos, y se valida en su story antes de integrarlo.

## 6. Separación de responsabilidades por agentes (Frontend y Backend)

El proyecto se estructura en una arquitectura desacoplada, con dos agentes independientes que se comunican exclusivamente a través del contrato de la sección 3.

### 6.1 Agente de Backend (datos, lógica y seguridad)
* **Responsabilidad exclusiva:** Procesa las reglas de negocio, se conecta a PostgreSQL y es el único que se integra con HashiCorp Vault.
* **Aislamiento de secretos:** Ninguna credencial sale del backend. Entrega al frontend solo datos procesados, limpios y seguros.
* **Arquitectura:** Clean Architecture estricta (`domain`, `usecases`, `infrastructure`). El dominio y los casos de uso no importan nada de `infrastructure`.

### 6.2 Agente de Frontend (presentación e interfaz)
* **Responsabilidad exclusiva:** Pinta la interfaz, captura las acciones del usuario y envía peticiones al backend según el contrato.
* **Restricción de seguridad:** Tiene prohibido almacenar API keys, contraseñas o tokens, y comunicarse con Vault. Su única fuente de verdad son los datos que entrega el backend.
* **Arquitectura:** Atomic Design, validado de forma aislada en Storybook antes de su integración.

## 7. Pruebas

* **Casos de uso:** Cada caso de uso del backend tiene pruebas unitarias (`.spec.ts`) con el repositorio simulado.
* **Componentes:** Cada componente tiene sus stories (sección 5) y pasa el panel de accesibilidad de Storybook (`@storybook/addon-a11y`) sin violaciones.
* **Contrato:** Las respuestas del backend se validan contra `contracts/openapi.yaml`.
* Un cambio no se integra si alguna prueba falla.

## 8. Accesibilidad (A11y) en todos los componentes funcionales

* **Responsabilidad absoluta:** Todo componente, por su naturaleza HTML, debe ser accesible y operable según el flujo que sigue el usuario.
* **Accesibilidad con criterio:** La accesibilidad se aplica con razón en cada escenario y nunca debe ser invasiva en la navegación.
* **Ubicación en cada página o sección:** El usuario siempre debe saber dónde está, incluso durante recargas y estados de carga. La accesibilidad debe ser una ayuda, no un impedimento.

## 9. Uso de recursos (imágenes, fuentes y video)

* **Imágenes:** Se priorizan AVIF y WebP según el escenario. Los íconos y gráficos vectoriales usan SVG (exentos de la regla de `<picture>`).
* **Fuentes:** Todas las fuentes se sirven en WOFF2.
* **Video:** Todo video usa el contenedor WebM (VP9 o AV1), con controles y subtítulos (ver DoD).

---

## 📋 Definition of Done (DoD) para componentes de Front-End

Un componente o funcionalidad está **Terminado (Done)** cuando cumple el 100% de los criterios siguientes.

### 1. Accesibilidad estructural (A11y)
- [ ] **Semántica nativa:** Se usan elementos HTML nativos (`<button>`, `<main>`, `<nav>`, `<a>`) para toda interacción. Prohibido usar `<div>` o `<span>` con manejadores de clic.
- [ ] **Interactividad y foco:** Todo elemento interactivo es operable con teclado (`Tab`, `Enter`, `Space`). Los componentes complejos manejan las flechas de dirección cuando el patrón de ARIA Authoring Practices lo requiere.
- [ ] **Estados dinámicos:** Los componentes con estados mutables actualizan en tiempo real sus atributos ARIA (`aria-expanded`, `aria-checked`, `aria-selected`, `aria-controls`, `aria-modal`).
- [ ] **Ubicación dinámica:** Los cambios de ruta actualizan el `<title>` del documento y devuelven el foco al contenedor principal (`<main tabindex="-1">`) o al `<h1>`.
- [ ] **Anunciadores asíncronos:** Los estados de carga, éxito y error se anuncian en un contenedor global único con `aria-live="polite"` y `aria-atomic="true"` (se usa `LiveAnnouncer` de `@angular/cdk/a11y`, que crea ese contenedor).
- [ ] **Errores visibles:** Si una petición falla, se muestra un mensaje de error claro. Nunca se muestra un valor por defecto (por ejemplo `0`) que parezca un dato real.

### 2. Estándares W3C para recursos y multimedia
- [ ] **Imágenes eficientes:** Las imágenes rasterizadas se sirven con `<picture>`: AVIF primero, WebP como alternativa y el formato heredado solo como *fallback* en `<img>`.
- [ ] **Accesibilidad en imágenes:** Toda imagen informativa tiene un `alt` descriptivo y contextual. Las decorativas usan `alt=""`.
- [ ] **Tipografías:** Las fuentes se cargan localmente en WOFF2 con `font-display: swap;`.
- [ ] **Video:** Todo video usa WebM con AV1 o VP9.
- [ ] **Accesibilidad en video:** El `<video>` incluye `controls` y al menos un `<track kind="subtitles">` válido (WCAG).

### 3. Calidad
- [ ] Existen stories de éxito, carga y error, y el panel A11y de Storybook no reporta violaciones.
- [ ] Los tipos de la API vienen del contrato generado, no de interfaces escritas a mano.

---

### 🤖 Guía de validación para agentes de IA (PR reviewers y asistentes CLI)

1. **Filtro de semántica:** Buscar `(click)` en etiquetas `<div>`, `<span>` o `<li>` dentro de las plantillas de Angular. Si aparece, marcar como *Fallo* y reemplazar por `<button>` o `<a>`.
2. **Filtro de recursos:** Buscar `<img>` con `.png` o `.jpg` que no estén dentro de un `<picture>`. Alertar sobre formatos no optimizados.
3. **Filtro de multimedia:** Detectar `.mp4` o `.mov` en etiquetas `<video>`. Exigir `.webm` (AV1/VP9) y la presencia de `<track>`.
4. **Filtro de estado:** Si un elemento cambia su visibilidad (por ejemplo un menú desplegable), validar que exista y cambie `aria-expanded`.
5. **Filtro de secretos:** Buscar cadenas que parezcan llaves, contraseñas o tokens en el código, y cualquier uso de `localStorage`/`sessionStorage` para tokens. Si aparece, marcar como *Fallo*.
6. **Filtro de encapsulación:** Buscar `ViewEncapsulation.ShadowDom`. Si aparece, marcar como *Fallo*.

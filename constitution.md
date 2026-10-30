# Constitución del Proyecto y Reglas Mandatarias de Desarrollo

Esta constitución establece las leyes de gobernanza técnica, principios arquitectónicos, de diseño, de accesibilidad y de seguridad obligatorios para este proyecto. Todo cambio, refactorización o adición al código fuente debe alinearse estrictamente con los siguientes mandatos.


## 1.1 Desarrollo del código, implementación y estructura

* **No repetir codigo innecesariamente el concepto de DRY:** Tratar de siempre optimizar el codigo que se legible para el humano nada de inventos locos o encriptografia o cosas raras de compilacion o comprimir
* **Tratar lo mas posible de no aplicar sobreingenieria a un codigo:** No se debe jamás aplicar sobre ingeniería algo esta estandarizado y avalado que funciona correctamente en su razón de ser.
* **Siempre si se hace un cambio es por una razon en especifico:** de caracter obligatorio justificarle con una mejora 
* **No se debe complejizar la logica de forma innecesaria:** usemos lo mas optimos y entendible posible, asi tengamos que aplicar algoritmos de forma entendible que cualquier persona que este aislado del mundo algoritmo pueda hacer y reutilizar hasta entender y explicar

 segura para obtener esa info debemos usar hashicorp vault como medida de seguridad.
### 1.1 Seguridad Llave y Protección de Credenciales
* **Aislamiento absoluto con HashiCorp Vault:** Todos los API keys, claves y contraseñas —vengan de donde vengan— deben estar almacenados en un entorno de forma encriptada y segura. Para obtener y consumir esta información, es obligatorio usar HashiCorp Vault como la única medida de seguridad del sistema.
* **Prohibición de valores literales:** No se debe, bajo ninguna circunstancia o parte del proyecto, mostrar o harcodear el contenido de las llaves literales. 
* **Nomenclatura y Abstracción:** El entorno del proyecto (`environment`) deberá llamar únicamente a una nomenclatura, variable o sufijo mapeado desde HashiCorp Vault para tomar los valores de las claves correspondientes.
* **Blindaje del Lado del Cliente (Browser Protection):** Se debe proteger la vía de transporte de datos para asegurar que ningún secreto sea detectable desde el navegador (browser). Para cumplir esto, el acceso a las llaves sensibles debe estar completamente restringido del lado del cliente, utilizando técnicas de encriptación, hashing o proxies/servidores intermedios (Backend-for-Frontend) que impidan que las llaves reales viajen expuestas en las solicitudes HTTP de la interfaz de usuario.

### 1.2 Gestión Eficiente de Eventos y Manipulación del DOM
* **Prohibición de encapsulamiento innecesario:** Queda restringido el uso de Shadow DOM o técnicas de encapsulamiento pesado únicamente para la iteración, propagación o captura de eventos de la interfaz de usuario.
* **Acceso mediante Referencias Nativas:** Para interactuar con los elementos interactivos o iterar flujos visuales, se priorizará el uso de referencias directas sobre el árbol del DOM (DOM References / `refs`) o mecanismos nativos equivalentes del framework seleccionado.
* **Optimización del Ciclo de Vida Visual:** Se evitará la abstracción artificial de los nodos del navegador. La manipulación e iteración de eventos debe ser lo más directa, ligera y transparente posible, garantizando que el origen y burbujeo (*event bubbling*) de las acciones del usuario sean completamente trazables y auditable desde el DOM global, sin bloqueos de encapsulamiento.
Usa el código con precaución.

### 1.3 Manipulación y cambios de modificacion de creacion de componentes respatando el Design System si tengo Storybooks o derivados

* **Aplicar patrones de disenos si es necesario evitando la sobreingenieria:** Nada de afecta o romper la arquitectura por capricho recordemos que estaremos  clean code architecture para esto y adicional tendremo atomic design para nuestros componentes
* **Todo cambio de componente que se haga debe ser en storybook:** Que se haga del cambio alli y que todo afecte al resto del uso de ese componente como se debe

## 2. Separación de Responsabilidades por Agentes (Frontend y Backend)

El proyecto se estructurará bajo una arquitectura desacoplable, asignando tareas específicas a dos agentes independientes que se comunican exclusivamente a través de contratos de API.

### 2.1 Agente de Backend (Capa de Datos, Lógica y Seguridad)
* **Responsabilidad exclusiva:** Es el único encargado de procesar las reglas de negocio complejas, conectarse a las bases de datos y realizar la integración directa con HashiCorp Vault.
* **Aislamiento de Secretos:** Ninguna credencial sale del entorno del Backend. Este agente procesa las solicitudes, inyecta las llaves seguras en el servidor y entrega al Frontend únicamente datos procesados, limpios y seguros.
* **Arquitectura:** Debe seguir estrictamente los principios de Clean Architecture (Domain, Use Cases, Infrastructure).

### 2.2 Agente de Frontend (Capa de Presentación e Interfaz)
* **Responsabilidad exclusiva:** Encargado únicamente de pintar la interfaz de usuario, capturar las acciones del usuario y enviar peticiones formateadas al Backend.
* **Restricción de Seguridad:** Tiene prohibido almacenar API keys, contraseñas o intentar comunicarse con HashiCorp Vault. Su única fuente de verdad son los datos que le provee el Agente de Backend.
* **Arquitectura:** Debe estructurarse bajo la metodología de Atomic Design y validarse obligatoriamente de forma aislada en Storybook antes de su integración.


### 3. Implementación de A11y en todos los componentes de Front que sean indispensablemente funcionables

* **Responsabilidad absoluta:** Cada componente por su naturalidad de acuerdo a los DOM o HTML de manera construida tiene que tener elementos para poder tener acceso a la accesiblidad, es decir tiene que ser funcional para que el flujo dicte a que flujo opera el cliente

* **Todo repositorio tiene tener accesibildad:** Todo repositorio tiene que tener accesibilidad con razón y criterio en cada escenario o flujo no puede ser para nada invasivo en la navegación del usuario

* **Cada pages o sección**: Debe indicar en cada navegación en donde esta el cliente, incluso en el momento que pasa recargar loading escenario que interactua el cliente, para que perciba en la mente realmente donde esta navegando en acda elemento del HTML, que la accesibilidad se convierta una ayuda, no un impedimento.

### 4. Uso de recursos como imágenes fuentes y textos

* **Toda imagen la gran mayoría debería usar estandar web W3C:** Para el uso imágenes preferiblemente usar todo tipo de imágenes AVIF o Web, esto puede ser usado dependiendo del escenario que mas conviene.

* **Toda fuente debe ser usar WOFF2 bajo estandares W3C:** Esto es indispensable su uso ya que es el reglamento estandár del proyecto que se debe alinear siempre.

* **Todo uso de video para la web debe ser WebM (VP9 o AV1) WCAG y W3C:** esto es como finalidad obligatoriamente para el proyecto.

## 📋 Definition of Done (DoD) para Componentes de Front-End

Un componente o funcionalidad se considera estrictamente **Terminado (Done)** cuando cumple con el 100% de los criterios de Accesibilidad (A11y) y Estándares de Recursos W3C detallados a continuación.

### 1. Criterios de Accesibilidad Estructural (A11y)
- [ ] **Semántica Nativa:** Se utilizan elementos HTML nativos (`<button>`, `<main>`, `<nav>`, `<a>`) para toda interacción. Queda prohibido el uso de `<div>` o `<span>` con manejadores de clics sin un árbol de accesibilidad justificado.
- [ ] **Interactividad y Foco:** Todo elemento interactivo es operable mediante teclado (`Tab`, `Enter`, `Space`). Los componentes complejos manejan correctamente las flechas de dirección cuando el patrón de diseño (ARIA Authoring Practices) lo requiera.
- [ ] **Estados Dinámicos:** Los componentes con estados mutables actualizan en tiempo real sus atributos ARIA correspondientes (`aria-expanded`, `aria-checked`, `aria-selected`, `aria-controls`, `aria-modal`).
- [ ] **Ubicación Dinámica (Navegación):** Los cambios de ruta en la aplicación actualizan inmediatamente el `<title>` del documento y devuelven el foco al contenedor principal (`<main tabindex="-1">`) o al encabezado `<h1>`.
- [ ] **Anunciadores Asíncronos:** Los estados de carga (*loading*), esqueletos o alertas inyectan texto descriptivo de forma clara y no invasiva en un contenedor global exclusivo con `aria-live="polite"` y `aria-atomic="true"`.

### 2. Estándares W3C para Recursos y Multimedia
- [ ] **Imágenes Eficientes:** Todas las imágenes se sirven de forma adaptativa utilizando la etiqueta `<picture>`. Se prioriza el formato **AVIF**, seguido de **WebP** como alternativa de compresión, dejando formatos heredados exclusivamente como *fallback* final dentro de `<img>`.
- [ ] **Accesibilidad en Imágenes:** Toda imagen crítica cuenta con un atributo `alt` descriptivo y contextual. Las imágenes puramente decorativas implementan un `alt=""` explícito para ser ignoradas por lectores de pantalla.
- [ ] **Tipografías:** Todas las fuentes del proyecto se cargan de forma local en formato **WOFF2** y aplican la regla CSS `font-display: swap;` para mitigar el bloqueo de renderizado.
- [ ] **Vídeo Mandatorio:** Todo vídeo integrado utiliza obligatoriamente el contenedor **WebM** con códecs modernos (**AV1** o **VP9**). 
- [ ] **Accesibilidad en Vídeo:** El elemento `<video>` incluye de forma mandatoria controles nativos (`controls`) y al menos una pista de subtítulos válida mediante la etiqueta `<track kind="subtitles">` en cumplimiento con las directrices WCAG.

---

### 🤖 Guía de Validación para Agentes de IA (Prompt Contextual)
*Para agentes de revisión de código (PR Reviewers) o asistentes CLI, utilicen las siguientes heurísticas de inspección:*

1. **Filtro de Semántica:** Buscar patrones del tipo `onClick` o `@click` en etiquetas `<div>`, `<span>` o `<li>`. Si se encuentran, verificar que posean `role="button"` y `tabindex="0"`. Si no, marcar como *Fallo*.
2. **Filtro de Recursos:** Escanear el código en busca de etiquetas `<img>` directas con formatos `.png` o `.jpg` que no estén envueltas en un elemento `<picture>`. Alertar sobre el uso de formatos no optimizados.
3. **Filtro de Multimedia:** Detectar cualquier archivo `.mp4` o `.mov` en etiquetas `<video>`. Exigir el reemplazo inmediato por `.webm` (códecs AV1/VP9) y la presencia del tag `<track>`.
4. **Filtro de Estado:** Si un elemento cambia visualmente su visibilidad u ocultamiento (ej. un menú desplegable), validar la existencia y mutación de `aria-expanded`.
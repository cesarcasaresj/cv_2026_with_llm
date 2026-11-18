---
title: De Angular 19 a Angular 22, lo que cambió versión a versión y cómo migrar
seoTitle: De Angular 19 a Angular 22
description: Signals estables, zoneless por defecto, OnPush por defecto y Signal Forms. Qué trajo cada versión de Angular, de la 19 a la 22, y cómo actualizar sin sustos.
category: Frontend
tags: [Angular, Signals, Migración, TypeScript]
status: published
publishedAt: 2026-11-18
cover:
  file: angular-19-a-22.svg
  decorative: true
---

# Cuatro versiones, un mismo rumbo

Entre noviembre de 2024 y junio de 2026 salieron Angular 19, 20, 21 y 22. Leídas por separado parecen listas de novedades sueltas, pero juntas cuentan una sola historia: **Angular dejó de depender de Zone.js y pasó a girar alrededor de los signals**. Cada versión dio un paso:

| Versión | Fecha | El paso grande |
|---|---|---|
| **19** | nov. 2024 | Standalone por defecto y primeras APIs reactivas (`linkedSignal`, `resource`) |
| **20** | may. 2025 | Los signals se vuelven estables (`effect`, `linkedSignal`, `toSignal`…) |
| **21** | nov. 2025 | **Zoneless por defecto**, Vitest por defecto, Signal Forms experimentales |
| **22** | jun. 2026 | **OnPush por defecto**, `resource` y Signal Forms estables, `@Service` |

Este mismo sitio está hecho con Angular 22, sin Zone.js y con `httpResource`, así que los ejemplos salen de código real.

# Angular 19: el punto de partida

- **Standalone por defecto.** Componentes, directivas y pipes ya no necesitan `standalone: true`; `ng update` añade `standalone: false` donde hacía falta.
- **Signals de componentes estables:** `input()`, `output()`, `model()`, `viewChild()`, `contentChild()` y `takeUntilDestroyed()`.
- **`linkedSignal()`** en *developer preview* y **`resource()` / `rxResource()`** como experimentales.
- **Cambio de tiempo en `effect()`:** los efectos de un componente pasan a ejecutarse durante la detección de cambios. Además ya no hace falta `allowSignalWrites` para escribir signals dentro.
- **`@let`** estable en las plantillas.
- **Hidratación incremental** y **modo de renderizado por ruta** (`RenderMode.Server`, `Client` o `Prerender`), ambos en *developer preview*.

# Angular 20: los signals ya son la base

- **Estables:** `effect()`, `linkedSignal()`, `toSignal()`, `toObservable()`, `afterRenderEffect()` y `afterNextRender()`.
- **`afterRender()` pasa a llamarse `afterEveryRender()`** (sin migración automática: búscalo a mano).
- **Zoneless** pasa a *developer preview* con `provideZonelessChangeDetection()` (el nombre ya no lleva `Experimental`).
- **Plantillas más expresivas:** operador `**`, `in`, `void` y plantillas de texto etiquetadas.
- **Nueva guía de estilo:** los archivos generados pierden el sufijo (`user.ts` con la clase `User`, en lugar de `user.component.ts`). Se puede mantener el estilo antiguo desde `angular.json`.
- **`typeCheckHostBindings`:** las vinculaciones de `host` se comprueban como las plantillas.
- **Hidratación incremental estable.**
- **Obsoletos:** `*ngIf`, `*ngFor` y `*ngSwitch`, en favor de `@if`, `@for` y `@switch` (hay migración automática).
- Requiere **TypeScript 5.8** y **Node.js 20**.

# Angular 21: adiós a Zone.js

- **Zoneless por defecto** en las aplicaciones nuevas. Las que todavía usan Zone.js deben declararlo con `provideZoneChangeDetection()`, y la migración lo añade sola.
- **Signal Forms** experimentales (`form()` en `@angular/forms/signals`), con `compatForm` para convivir con formularios reactivos.
- **Vitest por defecto** para las pruebas, con el builder `@angular/build:unit-test` estable. Karma queda obsoleto, aunque se puede seguir usando.
- **`HttpClient` disponible sin configurar:** `provideHttpClient()` solo hace falta para personalizarlo, por ejemplo con interceptores.
- **`@angular/aria`** en *developer preview*: directivas accesibles sin estilos (menús, pestañas, listas, árboles…).
- **Plantillas:** expresiones regulares y opciones como `rootMargin` en `@defer (on viewport)`.
- **Más errores en compilación:** leer un input requerido, un `model` o un `viewChild` antes de que existan ahora falla al compilar, no en producción.
- `SimpleChanges<T>` es genérico.

# Angular 22: el modelo nuevo, completo

- **OnPush por defecto.** Los componentes sin estrategia pasan a OnPush. La antigua `Default` se llama ahora **`Eager`**, y la migración la añade a los componentes que no tenían ninguna para que nada cambie sin que lo decidas.
- **Estables:** `resource()`, `rxResource()`, `httpResource()`, **Signal Forms** y `@angular/aria`.
- **`@Service()`**, un atajo de `@Injectable({ providedIn: 'root' })` pensado para `inject()`, e **`injectAsync()`** para cargar un servicio solo cuando se necesita.
- **`fetch` por defecto en `HttpClient`.** `withFetch()` queda obsoleto, y quien necesite el antiguo `XMLHttpRequest` usa `withXhr()`.
- **Hidratación incremental por defecto** con SSR.
- **`strictTemplates` activado por defecto.**
- **Cambios que rompen (todos con migración salvo uno):**
  - `?.` en plantillas devuelve `undefined` en lugar de `null`, igual que TypeScript.
  - Las funciones `canMatch` reciben un tercer parámetro obligatorio.
  - `paramsInheritanceStrategy` pasa a `'always'`. Este no tiene migración: si dependes del comportamiento anterior, configura `'emptyOnly'`.
- **Nuevo y experimental:** `debounced()`, un recurso que espera a que un valor deje de cambiar.
- Requiere **TypeScript 6** y **Node.js 22** (deja de soportar Node.js 20).

# Cómo migrar sin sustos

1. **Una versión mayor cada vez.** `ng update @angular/core@20 @angular/cli@20`, prueba, y luego la 21 y la 22. Las migraciones automáticas están pensadas para pasos de una versión.
2. **Antes de cada salto, actualiza Node.js y TypeScript.** Es la causa más común de errores raros al compilar.
3. **Lee lo que hizo cada migración** en el diff. Varias añaden código a propósito para que nada cambie, como `ChangeDetectionStrategy.Eager` o `provideZoneChangeDetection()`, y conviene retirarlo después, poco a poco.
4. **Revisa a mano lo que no tiene migración:** `afterRender` → `afterEveryRender`, `paramsInheritanceStrategy` y las pruebas con `fakeAsync` si pasas a Vitest.
5. **Después, adopta el modelo nuevo componente a componente:** inputs con `input()`, datos con `httpResource()`, estado con `computed()`. Ningún cambio obliga a reescribir todo de golpe.

La guía oficial [angular.dev/update-guide](https://angular.dev/update-guide) genera la lista exacta de pasos para tu versión de origen y de destino.

# Lo que se gana

Al final del camino, una aplicación Angular 22 no carga Zone.js, solo vuelve a pintar los componentes cuyos signals cambiaron y declara sus datos en lugar de suscribirse a ellos. En este sitio eso se nota en algo concreto: la portada cambia de idioma, vuelve a pedir el perfil y anima la transición sin una sola suscripción manual ni una llamada a `detectChanges()`.

# Fuentes

- [Novedades de Angular 19](https://blog.ninja-squad.com/2024/11/19/what-is-new-angular-19.0), [20](https://blog.ninja-squad.com/2025/05/28/what-is-new-angular-20.0), [21](https://blog.ninja-squad.com/2025/11/20/what-is-new-angular-21.0) y [22](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0), Ninja Squad
- [Guía de actualización de Angular](https://angular.dev/update-guide)

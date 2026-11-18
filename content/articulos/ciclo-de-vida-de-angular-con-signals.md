---
title: El ciclo de vida de Angular en 2026, qué hook usar y cuándo no usar ninguno
seoTitle: Ciclo de vida de Angular con signals
description: Los hooks de Angular siguen ahí, pero con signals, zoneless y OnPush por defecto la mayoría ya no hace falta. Qué usar en su lugar, con ejemplos reales.
category: Frontend
tags: [Angular, Signals, Buenas prácticas]
status: published
publishedAt: 2026-11-18
cover:
  file: ciclo-de-vida-angular.svg
  decorative: true
---

# El ciclo de vida cambió de idea, no de nombres

Los hooks de siempre siguen existiendo: `ngOnChanges`, `ngOnInit`, `ngAfterViewInit`, `ngOnDestroy`… Lo que cambió es el contexto. Desde Angular 21 las aplicaciones nuevas no usan Zone.js, y desde Angular 22 los componentes son **OnPush por defecto**. Con eso, la pantalla se actualiza cuando cambia un **signal**, no "cuando pasa algo" en el navegador.

La consecuencia práctica: casi todo lo que hacíamos en los hooks se expresa mejor con signals, y el código queda más corto y con menos errores de tiempo. Este artículo recorre cada hook y propone su reemplazo, con ejemplos de este mismo sitio (Angular 22, zoneless, SSR).

# El orden, en una tabla

| Hook | Cuándo corre | Uso clásico | En 2026, mejor… |
|---|---|---|---|
| `constructor` | Al crear la clase | Inyectar dependencias | `inject()` y preparar signals |
| `ngOnChanges` | Antes de `ngOnInit` y cada vez que cambia un input | Reaccionar a inputs | `computed()` o `linkedSignal()` |
| `ngOnInit` | Una vez, con los inputs ya puestos | Pedir datos | `httpResource()` / `resource()` |
| `ngDoCheck` | En **cada** detección de cambios | Detectar cambios a mano | Evitarlo |
| `ngAfterContentInit` | Una vez, con el contenido proyectado | Leer `@ContentChild` | `contentChild()` (signal) |
| `ngAfterViewInit` | Una vez, con la vista creada | Tocar el DOM | `viewChild()` + `afterNextRender()` |
| `ngAfter…Checked` | En cada detección de cambios | Casi nada | Evitarlo |
| `ngOnDestroy` | Antes de destruir el componente | Limpiar | `DestroyRef` / `takeUntilDestroyed()` |

La propia documentación lo dice sin rodeos sobre `ngDoCheck` y los hooks `*Checked`: *evítalos siempre que puedas*. Corren en cada ciclo de detección de cambios, y cualquier trabajo ahí se multiplica.

# `ngOnChanges` → estado derivado

El patrón antiguo copiaba un input a una propiedad cada vez que cambiaba:

```ts
// Antes: dos fuentes de verdad que hay que mantener sincronizadas
@Input() positions: Position[] = [];
total = 0;
ngOnChanges(changes: SimpleChanges) {
  if (changes['positions']) this.total = this.positions.length;
}
```

Con signals, el valor derivado **se declara** y Angular lo recalcula solo cuando su origen cambia:

```ts
readonly positions = input<Position[]>([]);
protected readonly total = computed(() => this.positions().length);
```

Si además el valor debe poder editarse (por ejemplo, un nivel seleccionado que vuelve a cero cuando llega otra lista), `linkedSignal()` es exactamente eso: un signal escribible que se reinicia cuando cambia su fuente.

Si todavía necesitas `ngOnChanges`, desde Angular 21 `SimpleChanges<T>` es genérico y los cambios quedan tipados por componente.

# `ngOnInit` → recursos declarativos

Pedir datos en `ngOnInit` obliga a suscribirse, guardar el resultado, manejar el estado de carga y cancelar al salir. `httpResource()` (estable desde Angular 22) hace todo eso a partir de una función reactiva:

```ts
// La portada de este sitio: el perfil se pide en el idioma activo
protected readonly profile = httpResource<Profile>(
  () => `/api/v1/profile?lang=${this.i18n.lang()}`,
);
```

Cuando cambia el idioma, la URL cambia y el recurso **vuelve a pedir solo**. Expone `value()`, `isLoading()`, `error()` y `hasValue()` como signals, así que la plantilla muestra carga, error o datos sin código extra. Con SSR, además, la respuesta del servidor se reutiliza al hidratar.

Un detalle que evita sorpresas: Angular 21 añadió un error de compilación si lees un input **requerido**, un `model` o un `viewChild` antes de que existan. El constructor no es el sitio para usarlos; un `computed()` sí.

# `ngAfterViewInit` → `viewChild()` y los render hooks

Para tocar el DOM directamente (un `<canvas>`, una librería de gráficos, medir un elemento) hay dos herramientas:

- `viewChild()` devuelve la referencia como signal.
- `afterNextRender()` ejecuta código **una vez** después de que Angular pinte. `afterEveryRender()` lo hace después de cada pintado.

```ts
private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

constructor() {
  afterNextRender(async () => {
    // Solo en el navegador: el código de la escena se descarga aquí, no en el primer render
    const { createStaffScene } = await import('./staff-scene');
    this.handle = createStaffScene(this.canvas().nativeElement, options);
  });
}
```

Dos ventajas sobre `ngAfterViewInit`:

1. **No corren en el servidor.** Con SSR, todo el código que usa `window` o `document` puede ir aquí sin preguntar si estamos en el navegador.
2. **Tienen fases** (`earlyRead`, `write`, `mixedReadWrite`, `read`). Separar escrituras y lecturas evita forzar al navegador a recalcular el diseño varias veces en el mismo fotograma.

Si lo que necesitas es reaccionar a signals **después** de pintar, `afterRenderEffect()` combina las dos ideas.

# `effect()`: para sincronizar, no para calcular

`effect()` es estable desde Angular 20 y es la pieza más fácil de usar mal. La regla que funciona:

- **Para calcular un valor a partir de otros → `computed()`.** Nunca un `effect()` que escribe en otro signal.
- **Para sincronizar con algo que Angular no controla → `effect()`.** Una clase en `<html>`, el `localStorage`, el título de la página, un anuncio para lectores de pantalla.

```ts
// El modo fiesta de la portada: un signal manda, y el effect solo refleja su valor fuera de Angular
effect(() => {
  this.document.documentElement.classList.toggle('is-party', this.party());
});
```

Cuidado con lo que se lee dentro: un effect se vuelve a ejecutar cuando cambia **cualquier** signal que lea. En este sitio, los anuncios de "Cargando artículos" leen los textos con `untracked()`. Si no lo hicieran, cambiar de idioma repetiría el anuncio aunque no haya cargado nada.

# `ngOnDestroy` → `DestroyRef`

`DestroyRef` permite escribir la limpieza **al lado** de lo que hay que limpiar, en lugar de repartirlo entre dos métodos:

```ts
const observer = new IntersectionObserver(callback);
observer.observe(element);
inject(DestroyRef).onDestroy(() => observer.disconnect());
```

Con RxJS, `takeUntilDestroyed()` hace lo mismo para una suscripción. Y dentro de un `effect()`, la función `onCleanup` limpia antes de cada nueva ejecución, ideal para observadores que dependen de una lista que cambia.

`DestroyRef` también tiene `destroyed`: compruébalo antes de usar el componente en código asíncrono (por ejemplo, después de un `await import()`), porque puede haberse destruido mientras tanto.

# La lista corta

- Inputs con `input()`, consultas con `viewChild()` / `contentChild()`.
- Estado derivado con `computed()`; editable y reiniciable con `linkedSignal()`.
- Datos con `httpResource()` o `resource()`, no con suscripciones en `ngOnInit`.
- DOM con `afterNextRender()` / `afterEveryRender()` y sus fases. Nunca se ejecutan en el servidor.
- `effect()` solo para sincronizar con el exterior, y `untracked()` para lo que no debe disparar el efecto.
- Limpieza con `DestroyRef`, `takeUntilDestroyed()` u `onCleanup`.
- `ngDoCheck` y los hooks `*Checked`: solo si no hay otra salida.

Los hooks no están prohibidos; simplemente dejaron de ser el centro. Un componente moderno se lee de arriba abajo como una lista de valores y de cómo se relacionan, y el ciclo de vida queda en dos o tres líneas al final.

# Fuentes

- [Ciclo de vida de los componentes, documentación oficial de Angular](https://angular.dev/guide/components/lifecycle)
- [Novedades de Angular 20, 21 y 22, Ninja Squad](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0)

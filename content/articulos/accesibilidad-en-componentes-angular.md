---
title: Accesibilidad desde el componente, estados, foco y anuncios en Angular
seoTitle: Accesibilidad en componentes Angular
description: Tres prácticas para que un componente Angular sea accesible desde su diseño, con HTML semántico, foco al cambiar de ruta y anuncios de estado.
category: Frontend
tags: [Angular, Accesibilidad, Storybook]
status: published
publishedAt: 2026-11-12
cover:
  file: accesibilidad.svg
  decorative: true
---

# Empezar por el HTML

La forma más barata de hacer accesible un componente es usar el elemento correcto. Un `<button>` ya se puede usar con el teclado, ya anuncia su función al lector de pantalla y ya tiene foco. Un `<div>` con un manejador de clic no tiene nada de eso, y añadirlo a mano es más código y más errores.

Por eso la primera regla del proyecto es sencilla: toda interacción usa un elemento nativo. Los botones de categoría, por ejemplo, son `<button>` con `aria-pressed`, que indica si el filtro está activo.

# El foco al cambiar de página

En una aplicación de una sola página, el navegador no recarga al cambiar de ruta. Quien usa lector de pantalla puede quedarse sin saber que la página cambió.

La solución es devolver el foco al contenedor principal (`<main tabindex="-1">`) después de cada navegación y actualizar el `<title>` del documento. Con eso, el lector anuncia la página nueva igual que si se hubiera recargado.

# Anunciar los estados

Cargar, fallar y terminar son estados que se ven, pero que no se oyen. Angular CDK incluye `LiveAnnouncer`, que escribe los mensajes en una región `aria-live` oculta visualmente:

- "Cargando categorías" mientras llega la respuesta.
- "No se pudieron cargar las categorías" si falla.
- "3 categorías disponibles" al terminar.

Un detalle importante: esa región debe estar oculta con los estilos del CDK. Si no se incluyen, el último anuncio aparece escrito en la página.

# Comprobarlo en Storybook

Cada componente tiene historias para sus estados de éxito, carga y error, y el panel de accesibilidad de Storybook revisa cada una con axe. Un estado de error que nadie probó es un estado que probablemente no es accesible.

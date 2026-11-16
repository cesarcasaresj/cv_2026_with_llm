# Artículos

Cada archivo `.md` de esta carpeta es un artículo. El nombre del archivo es su **slug** (la URL será `/articulos/<slug>`), así que debe ir en minúsculas, con números y guiones, y no debe cambiar después de publicar.

Para cargarlos en la base de datos (desde `backend/`):

```
npm run load:content -- --author tu@correo.com
```

Volver a cargar un archivo lo actualiza; no lo duplica. Si algún archivo no cumple las reglas, no se carga nada y el script indica qué corregir.

## Formato

```markdown
---
title: Título del artículo (10 a 110 caracteres)
seoTitle: Título corto para buscadores (opcional, máximo 60)
description: Entradilla y meta description (50 a 160 caracteres; obligatoria para publicar)
category: Arquitectura          # una sola, obligatoria y de la lista fija (ver abajo)
tags: [OpenAPI, TypeScript]     # de 0 a 10
status: published               # draft (por defecto) o published
publishedAt: 2026-11-15         # obligatoria para publicar
updatedAt: 2026-11-20           # opcional; por defecto, publishedAt
cover:                          # opcional
  file: mi-portada.png          # dentro de content/articulos/imagenes/
  alt: Qué muestra la imagen    # obligatorio, salvo decorative: true
  decorative: false
---

# Primera sección

El cuerpo va en Markdown.
```

## Categoría

Las categorías son una **lista fija** que se gestiona en la aplicación, en *Mi cuenta → Categorías* (spec.md, HU-09). El script nunca crea categorías:

- **Artículo nuevo:** `category` debe coincidir con una categoría existente (se compara por su slug, así que da igual usar mayúsculas o tildes). Si no existe, no se carga nada y el script lista las disponibles.
- **Artículo ya cargado:** manda la categoría asignada en la aplicación (HU-08). Si el archivo dice otra, el script avisa con `!` y no la cambia.

## Reglas de accesibilidad y SEO

- **Encabezados:** el título ya es el `<h1>` de la página. En el cuerpo, `#` se convierte en `<h2>`, `##` en `<h3>`, y así sucesivamente. Empieza las secciones con `#` y no saltes niveles.
- **Imágenes:** describe lo que aporta la imagen en `alt`. Marca `decorative: true` solo si no aporta información.
- **Enlaces:** el texto del enlace debe entenderse solo ("guía de accesibilidad del W3C", no "haz clic aquí").
- **Portadas:** se recomienda 1200 × 630 píxeles (el tamaño que usan las redes sociales). El script genera las versiones AVIF, WebP y JPG en `frontend/public/images/articulos/`.

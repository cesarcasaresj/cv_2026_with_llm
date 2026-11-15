---
title: Contratos OpenAPI como fuente de verdad entre frontend y backend
seoTitle: OpenAPI como fuente de verdad
description: Por qué el contrato OpenAPI se cambia antes que el código y cómo generar tipos de TypeScript para que frontend y backend no se desalineen.
category: Arquitectura
tags: [OpenAPI, TypeScript, Buenas prácticas]
status: published
publishedAt: 2026-11-14
updatedAt: 2026-11-15
---

# Dos equipos, un solo acuerdo

Cuando el frontend y el backend evolucionan por separado, el riesgo más común no es un error de lógica: es que cada lado tenga una idea distinta de cómo es una respuesta. Un campo renombrado en el servidor rompe la pantalla sin que ningún compilador lo avise.

En este proyecto ese acuerdo vive en un único archivo, `contracts/openapi.yaml`, y la regla es que **se cambia primero el contrato y después el código**.

# Tipos generados, no escritos a mano

A partir del contrato, `openapi-typescript` genera los tipos de TypeScript en los dos lados. Si el contrato dice que un artículo tiene `publishedAt`, el backend no compila hasta que lo envía y el frontend no compila hasta que lo usa con ese nombre.

Escribir esas interfaces a mano sería duplicar el contrato, y lo duplicado termina desalineado.

# Errores con el mismo formato

El contrato también fija cómo se ve un error: siempre `code`, `message` y `timestamp`. El mensaje está pensado para la persona que usa la aplicación, nunca incluye trazas ni consultas SQL, y el frontend puede mostrarlo tal cual.

# Versionar sin miedo

Todas las rutas van bajo `/api/v1/`. Un cambio que rompe la compatibilidad no modifica la versión 1: crea una versión 2. Así quien consume la API puede migrar a su ritmo.

La [especificación de OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) es extensa, pero para empezar bastan tres piezas: rutas, esquemas y respuestas de error comunes.

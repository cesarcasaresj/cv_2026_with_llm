# Plan de lectura y preparación del proyecto

## Problema
El repositorio actual contiene una base arquitectónica y normativa muy clara, pero no parece estar scaffolded ni implementado aún en su forma completa. La documentación describe un monorepo con backend, frontend, contratos gRPC y Vault, pero la estructura física real disponible es mínima y se requiere confirmar el estado actual antes de comenzar el desarrollo real.

## Estado actual observado
- El repositorio incluye la documentación central: [README.md](../README.md), [architecture.md](../architecture.md), [constitution.md](../constitution.md) y [references.md](../references.md).
- Existe un contrato base en [proto/posts.proto](../proto/posts.proto), pero no se observa la carpeta `backend/` ni la carpeta `frontend/` ni el directorio `.vault/`.
- El proyecto parece estar en fase de definición de arquitectura y gobernanza, no en un estado de implementación funcional.

## Enfoque propuesto
1. Confirmar y cerrar la base arquitectónica del monorepo.
2. Escoger la estructura exacta y las convenciones para backend/frontend antes de generar código real.
3. Crear el scaffold mínimo del proyecto siguiendo el contrato gRPC y la separación de responsabilidades descrita.
4. Integrar la capa de seguridad con Vault y dejar una base de validación A11y/Storybook acorde a la constitución.

## Todo principal
- Revisar la arquitectura y las reglas del proyecto.
- Definir/validar contratos `.proto` para dominio principal.
- Crear el backend con Node.js + TypeScript y Clean Architecture.
- Crear el frontend Angular zoneless + Atomic Design + Storybook.
- Configurar seguridad y entorno local con Vault.

## Consideraciones
- La documentación marca principios muy estrictos sobre A11y, seguridad y moderación de la complejidad; cualquier implementación debe respetarlos.
- Antes de codificar, conviene confirmar si se desea continuar con la base documental o si el cliente quiere que el repositorio se transforme en un monorepo real y funcional.
- La fase siguiente más sensata es scaffold completo de backend/frontend y contrato base, manteniendo la arquitectura descrita como referencia inamovible.

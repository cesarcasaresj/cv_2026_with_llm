---
title: Secretos con HashiCorp Vault también en desarrollo local
seoTitle: Secretos con Vault en desarrollo local
description: Cómo usar Vault en modo dev para que el backend lea las credenciales igual en local que en producción, sin contraseñas en el repositorio.
category: Seguridad
tags: [Vault, Node.js, Buenas prácticas]
status: published
publishedAt: 2026-11-10
cover:
  file: vault-local.svg
  alt: Diagrama de tres cajas. El backend pide las credenciales a Vault y después se conecta a PostgreSQL.
---

# El problema de las contraseñas en archivos

En muchos proyectos la contraseña de la base de datos vive en un archivo de configuración. Funciona, pero tiene un coste: el código de desarrollo y el de producción leen los secretos de forma distinta, y tarde o temprano alguno termina en el historial de git.

En este proyecto la regla es otra: **el código solo conoce la ruta del secreto, nunca su valor**. La variable de entorno dice `VAULT_POSTS_DB_PATH=cv-app/database`, y el backend pregunta a Vault qué hay en esa ruta al arrancar.

# Vault en modo dev

Vault tiene un modo de desarrollo que arranca en un segundo, sin configuración y con todo en memoria. Es justo lo que hace falta en local:

- El mismo cliente HTTP que se usará en producción.
- Ningún secreto escrito en el código ni en el repositorio.
- Un único archivo `.env` local, ignorado por git, con el token de desarrollo.

Como el modo dev olvida todo al reiniciarse, un script vuelve a cargar las credenciales en cada arranque. Así el entorno siempre se puede reconstruir desde cero.

# Qué cambia en producción

Solo cambia la forma de autenticarse ante Vault: en lugar de un token fijo, el servidor usa un método como AppRole. El resto del código es idéntico, y esa es la ventaja: lo que se prueba en local es lo que se despliega.

# Buenas prácticas que salen de aquí

1. Los mensajes de error indican la ruta que falló, nunca el valor del secreto.
2. Las credenciales se guardan en caché unos minutos para no consultar Vault en cada petición.
3. Si Vault no responde, el backend no arranca y lo dice con claridad, en lugar de fallar más tarde con un error confuso.

Para profundizar, la [documentación oficial del modo dev de Vault](https://developer.hashicorp.com/vault/docs/concepts/dev-server) explica sus límites y por qué nunca debe usarse en producción.

# Enterprise Decoupled Architecture: Angular (Zoneless) & Node.js Monorepo

Este proyecto es una muestra de arquitectura de software empresarial, diseñada bajo un modelo desacoplado y gobernado por reglas estrictas de desarrollo guiado por especificación (SDD). El sistema se comunica mediante **REST/JSON con contrato OpenAPI**, gestiona los secretos con **HashiCorp Vault**, persiste en **PostgreSQL**, usa reactividad nativa con **Signals** en el cliente y pone la accesibilidad universal (**A11y**) como requisito de entrega.

## 🚀 Pilares tecnológicos

* **Frontend moderno:** **Angular zoneless**, con la API declarativa `httpResource` y reactividad basada en **Signals**.
* **Diseño modular controlado:** Interfaz organizada con **Atomic Design**, documentada y validada de forma aislada en **Storybook** (incluido el panel de accesibilidad).
* **Contrato tipado de extremo a extremo:** La API se define en **OpenAPI 3.1** (`contracts/openapi.yaml`) y los tipos TypeScript de backend y frontend se generan desde ahí.
* **Seguridad Zero-Trust:** Ningún secreto vive en texto plano ni llega al navegador. El backend lee las credenciales de **HashiCorp Vault** en tiempo de ejecución, y la sesión usa un JWT en cookie `HttpOnly`.
* **Backend con Clean Architecture:** **Node.js + TypeScript + Express 5**, con dominio y casos de uso independientes de la infraestructura.
* **Accesibilidad universal (A11y):** HTML5 semántico y directrices **WAI-ARIA** para una navegación por teclado predecible y compatible con lectores de pantalla.

---

## 📂 Gobernanza técnica

El repositorio se rige por un marco explícito pensado para desarrollo guiado por agentes de IA:

1. [`constitution.md`](./constitution.md) — **Leyes mandatorias:** principios de código (DRY, no sobreingeniería), seguridad con Vault, contrato de API, Atomic Design, pruebas, A11y, recursos W3C y Definition of Done.
2. [`architecture.md`](./architecture.md) — **Mapa físico del monorepo** y decisiones técnicas.
3. [`references.md`](./references.md) — **Patrones de código** que los agentes deben seguir en backend y frontend.
4. [`contracts/openapi.yaml`](./contracts/openapi.yaml) — **Contrato de la API**, fuente de verdad del tipado.
5. [`plan.md`](./plan.md) — **Plan por fases** con criterios de "listo".
6. [`DEPLOY.md`](./DEPLOY.md) — **Publicación** en el VPS (Docker Compose + Caddy) con despliegue automático desde GitHub.

---

## 🛠️ Estructura del monorepo

```text
├── .vault/            # Script de carga de secretos para el Vault local
├── contracts/         # Contrato OpenAPI (REST/JSON)
├── backend/           # Node.js + TypeScript + Express 5 (Clean Architecture)
├── frontend/          # Angular zoneless (Atomic Design + Storybook)
└── docker-compose.yml # PostgreSQL + Vault para desarrollo local
```

---

## 💻 Arranque local

Requisitos: Docker Desktop y Node.js (versión LTS).

### 1. Infraestructura (PostgreSQL + Vault)
```bash
cp .env.example .env      # Cambiar los valores de ejemplo
docker compose up -d      # Levanta Postgres, Vault y carga los secretos
```

### 2. Generar los tipos desde el contrato
```bash
cd backend && npm run generate:api
cd ../frontend && npm run generate:api
```

### 3. Ejecutar el ecosistema
```bash
# Backend (lee el .env de la raíz)
cd backend && npm run dev

# Frontend (redirige /api al backend mediante proxy.conf.json)
cd frontend && npm start

# Design System y revisión de accesibilidad
cd frontend && npm run storybook
```

> Los scripts `generate:api`, `dev`, `start` y `storybook` se crean en las fases 2 a 4 de [`plan.md`](./plan.md).

---

## 🎯 Propósito del proyecto
Demostrar que la velocidad de entrega no está reñida con una arquitectura rigurosa. Al desarrollar con agentes guiados por esta documentación, el sistema escala de forma predecible, limpia, segura y accesible.

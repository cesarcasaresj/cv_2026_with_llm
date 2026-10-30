# Enterprise Decoupled Architecture: Angular (Zoneless) & Node.js Monorepo

Este proyecto es una muestra de arquitectura de software empresarial de alto rendimiento, diseñada bajo un modelo desacoplado y gobernado por reglas estrictas de desarrollo automático. El sistema implementa comunicación binaria mediante **gRPC**, gestión segura de secretos con **HashiCorp Vault**, reactividad moderna nativa en el cliente y un enfoque absoluto en la accesibilidad universal (**A11y**).

## 🚀 Pilares Tecnológicos de Élite

*   **Frontend Vanguardista:** Desarrollado en **Angular (v19+) totalmente Zoneless**, aprovechando la API declarativa de recursos asíncronos (`resource` / `httpResource`) y reactividad nativa pura basada en **Signals**.
*   **Diseño Modular Controlado:** Interfaz de usuario estructurada bajo la metodología de **Atomic Design**, documentada, aislada y validada de forma mandatoria mediante **Storybook**.
*   **Comunicación de Alta Velocidad (gRPC):** Contratos inmutables cross-platform definidos mediante **Protocol Buffers (proto3)** y transportados a través de **ConnectRPC** sobre HTTP/2 binario, eliminando la sobrecarga y falta de tipado de REST/JSON tradicional.
*   **Seguridad Bancaria (Zero-Trust):** Aislamiento absoluto de credenciales y API keys. Ningún secreto reside en texto plano ni en entornos del cliente; toda la información crítica se consulta en memoria en tiempo de ejecución mapeada desde **HashiCorp Vault**.
*   **Accesibilidad de Diseño Universal (A11y):** Cumplimiento estricto de estándares semánticos HTML5 y directrices **WAI-ARIA** para garantizar una navegación por teclado fluida, predecible y compatible con lectores de pantalla.

---

## 📂 Estructura de Gobernanza Técnica y Arquitectura

El repositorio no se rige por impulsos técnicos, sino por un marco de gobernanza explícito diseñado para entornos de desarrollo autónomos o guiados por Agentes de IA:

1.  [`constitution.md`](./constitution.md) — **Leyes Mandatarias de Programación:** Define los límites de diseño de software del proyecto (Principios DRY, prohibición de sobreingeniería, blindaje del navegador frente a credenciales, veto al Shadow DOM y obligatoriedad de pruebas automatizadas).
2.  [`references.md`](./references.md) — **Patrones y Guías de Código:** Repositorio de ejemplos técnicos exactos que los desarrolladores y agentes de IA deben clonar para implementar lógica en el Backend (Node.js) y Frontend (Angular con `resource` y ConnectRPC).
3.  [`architecture.md`](./architecture.md) — **Mapa Físico del Monorepo:** Estructura de directorios rígida que asegura la separación física de responsabilidades entre el agente de cliente y el agente de servidor.
4.  [`posts.proto`](./contracts/posts.proto) — **Contratos de Datos Inmutables:** Definición de gRPC que autogenera el tipado estricto extremo a extremo de la aplicación.

---

## 🛠️ Estructura Física del Monorepo

```text
├── .vault/                 # Configuración de secretos e infraestructura local de Vault
├── contracts/               # Contratos globales e inmutables de gRPC (.proto)
├── backend/                # Agente de Servidor: Node.js + TypeScript (Clean Architecture)
└── frontend/               # Agente de Cliente: Angular Workspace Zoneless (Atomic Design)
```

---

## 💻 Requisitos de Arranque Local

### 1. Inicialización de Secretos (Vault Local Mock)
Para cumplir con la Sección 1.2 de la Constitución, levante el entorno seguro local:
```bash
# Servidor de Vault en modo desarrollo o simulación por memoria local
vault server -dev
```

### 2. Compilación de Contratos gRPC (Protocol Buffers)
Genere los stubs e interfaces TypeScript estrictas para ambos agentes:
```bash
npm run generate:proto
```

### 3. Ejecución del Ecosistema
```bash
# Levantar servidor Backend
cd backend && npm run dev

# Levantar cliente Frontend e interfaz de diseño aislada
cd frontend && npm run start
# Para evaluar componentes visuales y criterios A11y:
npm run storybook
```

---

## 🎯 Propósito del Proyecto
Demostrar de manera práctica que la velocidad de entrega de características (*features*) no está reñida con la rigurosidad de la arquitectura. Al delegar el desarrollo en agentes guiados bajo esta documentación, el sistema escala de manera predecible, limpia, accesible y con un rendimiento óptimo de cara al usuario final y a la infraestructura Cloud.

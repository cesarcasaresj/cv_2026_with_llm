├── .vault/                 # Configuración y JSON de desarrollo para HashiCorp Vault local
├── backend/                # AGENTE DE BACKEND (Node.js + TypeScript)
│   ├── src/
│   │   ├── core/           # Capa Agnóstica (Clean Architecture)
│   │   │   ├── domain/     # Interfaces de repositorios y modelos de datos estrictos
│   │   │   └── usecases/   # Casos de uso puros y pruebas unitarias (.spec.ts)
│   │   ├── infrastructure/ # Capa de Implementación
│   │   │   ├── controllers/# Controladores de API REST
│   │   │   ├── database/   # Conexión y queries físicas a la Base de Datos
│   │   │   └── security/   # Adaptador físico y cliente de HashiCorp Vault
│   │   └── main.ts         # Punto de entrada del servidor
│   └── package.json
│
├── frontend/               # AGENTE DE FRONTEND (Angular Workspace v19+)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Infraestructura del cliente (Servicios, Interceptores, Seguridad)
│   │   │   └── presentation/ # UI basada en Atomic Design e Inclusión (A11y)
│   │   │       ├── components/
│   │   │       │   ├── atoms/     # Botones, inputs semánticos, elementos de foco simple
│   │   │       │   ├── molecules/ # PostCounter con httpResource, buscadores reactivos
│   │   │       │   └── organisms/ # Contenedores complejos y estructuras globales
│   │   │       └── pages/         # Vistas finales conectadas al flujo de control nativo
│   │   └── main.ts         # Inicialización de la aplicación Zoneless Angular
│   ├── .storybook/         # Configuración del Design System independiente
│   └── package.json
│
├── constitution.md         # Leyes mandatorias de desarrollo
└── references.md           # Patrones de código técnicos con Signals e httpResource
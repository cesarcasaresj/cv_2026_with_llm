# Referencias de Implementación y Patrones de Código

Este documento es la guía mandatoria para los agentes de desarrollo. Define el patrón exacto para crear nuevas funcionalidades, usando como ejemplo el contador de publicaciones (`GET /api/v1/posts/count`) de `contracts/openapi.yaml`.

Orden de trabajo para cualquier funcionalidad nueva:

1. Agregar o cambiar el endpoint en `contracts/openapi.yaml`.
2. Regenerar los tipos (`npm run generate:api` en backend y frontend).
3. Backend: dominio → caso de uso (+ prueba) → repositorio → controlador.
4. Frontend: componente → stories (éxito, carga, error) → integración en la página.

---

## 1. Agente de Backend (Clean Architecture)

### 1.1 Dominio: modelo e interfaz del repositorio
El dominio no sabe nada de Postgres, Vault ni Express.

```typescript
// backend/src/core/domain/PostCount.ts
export interface PostCount {
  total: number;
  lastUpdated: Date | null;
}

export interface PostRepository {
  getTotalPostsCount(): Promise<PostCount>;
}
```

### 1.2 Caso de uso y su prueba
El repositorio llega por el constructor (inyección de dependencias), así se puede probar con uno simulado.

```typescript
// backend/src/core/usecases/GetTotalPostsCount.ts
import type { PostCount, PostRepository } from '../domain/PostCount';

export class GetTotalPostsCount {
  constructor(private readonly posts: PostRepository) {}

  execute(): Promise<PostCount> {
    return this.posts.getTotalPostsCount();
  }
}
```

```typescript
// backend/src/core/usecases/GetTotalPostsCount.spec.ts
import { describe, expect, it } from 'vitest';
import { GetTotalPostsCount } from './GetTotalPostsCount';

describe('GetTotalPostsCount', () => {
  it('devuelve el total que entrega el repositorio', async () => {
    const fakeRepository = {
      getTotalPostsCount: async () => ({ total: 3, lastUpdated: null }),
    };

    const result = await new GetTotalPostsCount(fakeRepository).execute();

    expect(result.total).toBe(3);
  });
});
```

### 1.3 Infraestructura: cliente de Vault
Se lee el secreto por su **ruta** (nunca por su valor) usando la API HTTP de Vault (KV v2). El resultado se guarda en caché unos minutos para no consultar Vault en cada petición.

```typescript
// backend/src/infrastructure/security/VaultClient.ts
type Secret = Record<string, string>;

export class VaultClient {
  private readonly cache = new Map<string, { data: Secret; expiresAt: number }>();

  constructor(
    private readonly address: string,
    private readonly token: string,
    private readonly cacheMs = 5 * 60_000,
  ) {}

  async readSecret(path: string): Promise<Secret> {
    const cached = this.cache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const response = await fetch(`${this.address}/v1/secret/data/${path}`, {
      headers: { 'X-Vault-Token': this.token },
    });
    if (!response.ok) {
      throw new Error(`VAULT_READ_FAILED (${response.status}) en la ruta ${path}`);
    }

    const body = await response.json();
    const data: Secret = body.data.data;
    this.cache.set(path, { data, expiresAt: Date.now() + this.cacheMs });
    return data;
  }
}
```

### 1.4 Infraestructura: pool de PostgreSQL y repositorio
El pool se crea **una sola vez** al arrancar, con las credenciales que entrega Vault. El repositorio solo ejecuta consultas.

```typescript
// backend/src/infrastructure/database/DatabasePool.ts
import pg from 'pg';
import type { VaultClient } from '../security/VaultClient';

export async function createDatabasePool(vault: VaultClient, secretPath: string): Promise<pg.Pool> {
  const credentials = await vault.readSecret(secretPath);

  return new pg.Pool({
    host: credentials.host,
    port: Number(credentials.port),
    database: credentials.database,
    user: credentials.username,
    password: credentials.password,
    max: 10,
  });
}
```

```typescript
// backend/src/infrastructure/database/PostgresPostRepository.ts
import type { Pool } from 'pg';
import type { PostCount, PostRepository } from '../../core/domain/PostCount';

export class PostgresPostRepository implements PostRepository {
  constructor(private readonly pool: Pool) {}

  async getTotalPostsCount(): Promise<PostCount> {
    // COUNT(*) llega como texto desde Postgres, por eso se convierte con Number()
    const { rows } = await this.pool.query<{ total: string; last_updated: Date | null }>(
      'SELECT COUNT(*) AS total, MAX(created_at) AS last_updated FROM posts',
    );

    return { total: Number(rows[0].total), lastUpdated: rows[0].last_updated };
  }
}
```

### 1.5 Infraestructura: controlador REST y manejo de errores
El controlador traduce el modelo del dominio al formato del contrato. Express 5 envía los errores de funciones `async` al manejador de errores sin necesidad de `try/catch`.

```typescript
// backend/src/infrastructure/controllers/postRoutes.ts
import { Router } from 'express';
import type { GetTotalPostsCount } from '../../core/usecases/GetTotalPostsCount';
import type { components } from '../../generated/api';

type PostCountResponse = components['schemas']['PostCountResponse'];

export function postRoutes(getTotalPostsCount: GetTotalPostsCount): Router {
  const router = Router();

  router.get('/count', async (_request, response) => {
    const result = await getTotalPostsCount.execute();
    const body: PostCountResponse = {
      total: result.total,
      lastUpdated: result.lastUpdated?.toISOString() ?? null,
    };
    response.json(body);
  });

  return router;
}
```

```typescript
// backend/src/infrastructure/controllers/errorHandler.ts
import type { ErrorRequestHandler } from 'express';
import type { components } from '../../generated/api';

type ApiError = components['schemas']['ApiError'];

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error); // El detalle técnico se queda en los logs del servidor

  const body: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'No pudimos completar la solicitud. Intenta de nuevo en unos minutos.',
    timestamp: new Date().toISOString(),
  };
  response.status(500).json(body);
};
```

### 1.6 Punto de entrada: armar las dependencias
`main.ts` es el único lugar que conoce todas las piezas y las conecta.

```typescript
// backend/src/main.ts
import express from 'express';
import { VaultClient } from './infrastructure/security/VaultClient';
import { createDatabasePool } from './infrastructure/database/DatabasePool';
import { PostgresPostRepository } from './infrastructure/database/PostgresPostRepository';
import { GetTotalPostsCount } from './core/usecases/GetTotalPostsCount';
import { postRoutes } from './infrastructure/controllers/postRoutes';
import { errorHandler } from './infrastructure/controllers/errorHandler';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

const vault = new VaultClient(requiredEnv('VAULT_ADDR'), requiredEnv('VAULT_TOKEN'));
const pool = await createDatabasePool(vault, requiredEnv('VAULT_POSTS_DB_PATH'));
const getTotalPostsCount = new GetTotalPostsCount(new PostgresPostRepository(pool));

const app = express();
app.use('/api/v1/posts', postRoutes(getTotalPostsCount));
app.use(errorHandler);

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`Backend escuchando en http://localhost:${port}`));
```

---

## 2. Agente de Frontend (Angular, httpResource, Atomic Design y A11y)

Reglas del componente: standalone (valor por defecto), encapsulación por defecto (sin Shadow DOM), datos con `httpResource` (Signals, sin suscripciones manuales de RxJS), tipos tomados del contrato generado y estados anunciados con `LiveAnnouncer`.

> `httpResource` se importa desde `@angular/common/http`. Verificar en la documentación de la versión instalada si sigue marcado como experimental.

### 2.1 Molécula: PostCounter

```typescript
// frontend/src/app/presentation/components/molecules/post-counter/post-counter.component.ts
import { Component, effect, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { components } from '../../../../core/api/generated';

type PostCountResponse = components['schemas']['PostCountResponse'];

@Component({
  selector: 'app-post-counter',
  templateUrl: './post-counter.component.html',
  styleUrl: './post-counter.component.css',
})
export class PostCounterComponent {
  private readonly announcer = inject(LiveAnnouncer);

  protected readonly posts = httpResource<PostCountResponse>(() => '/api/v1/posts/count');

  constructor() {
    // Anuncia cada cambio de estado en el contenedor global aria-live="polite"
    effect(() => {
      if (this.posts.isLoading()) {
        this.announcer.announce('Cargando el total de publicaciones', 'polite');
      } else if (this.posts.error()) {
        this.announcer.announce('No se pudo cargar el total de publicaciones', 'polite');
      } else if (this.posts.value()) {
        this.announcer.announce(`Total de publicaciones: ${this.posts.value()!.total}`, 'polite');
      }
    });
  }
}
```

### 2.2 Plantilla
Elementos semánticos, un título que identifica la sección, y un estado de error explícito. Nunca se muestra `0` cuando en realidad hubo un error.

```html
<!-- frontend/src/app/presentation/components/molecules/post-counter/post-counter.component.html -->
<section class="post-counter" aria-labelledby="post-counter-title" [attr.aria-busy]="posts.isLoading()">
  <h2 id="post-counter-title" class="post-counter__label">Publicaciones totales</h2>

  @if (posts.isLoading()) {
    <p class="post-counter__value post-counter__value--loading">Cargando…</p>
  } @else if (posts.error()) {
    <p class="post-counter__value post-counter__value--error">
      No pudimos cargar el total. Intenta de nuevo en unos minutos.
    </p>
  } @else if (posts.value(); as data) {
    <p class="post-counter__value">{{ data.total }}</p>
  }
</section>
```

### 2.3 Storybook: stories aisladas con respuestas simuladas
Se simula el backend con un interceptor de `HttpClient` (nativo de Angular, sin librerías extra). Cada estado tiene su story y el panel A11y debe quedar sin violaciones.

```typescript
// frontend/src/app/presentation/components/molecules/post-counter/post-counter.component.stories.ts
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { PostCounterComponent } from './post-counter.component';

// Crea un "backend falso" que responde siempre lo mismo
function mockBackend(respond: HttpInterceptorFn) {
  return applicationConfig({ providers: [provideHttpClient(withInterceptors([respond]))] });
}

const meta: Meta<PostCounterComponent> = {
  title: 'Design System/Molecules/PostCounter',
  component: PostCounterComponent,
};
export default meta;

type Story = StoryObj<PostCounterComponent>;

export const Exito: Story = {
  decorators: [
    mockBackend(() =>
      of(new HttpResponse({ status: 200, body: { total: 42, lastUpdated: '2026-11-01T10:00:00Z' } })),
    ),
  ],
};

export const Cargando: Story = {
  decorators: [mockBackend(() => NEVER)], // La petición nunca termina
};

export const ConError: Story = {
  decorators: [mockBackend(() => throwError(() => new HttpErrorResponse({ status: 500 })))],
};
```

### 2.4 Proxy de desarrollo
Angular redirige `/api` al backend, así el navegador cree que todo viene del mismo origen (sin CORS y con cookies funcionando).

```json
// frontend/proxy.conf.json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```

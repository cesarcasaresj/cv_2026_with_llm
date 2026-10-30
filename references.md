# Referencias de Implementación y Patrones de Código (Angular Edition)

Este documento sirve como guía mandatoria y fuente de contexto para los agentes de desarrollo. Define el patrón exacto de diseño de código para la creación de nuevas características en el sistema, tomando como ejemplo el flujo de consulta del contador de publicaciones (`PostCount`) utilizando Angular.

---

## 1. Patrón del Agente de Backend (Clean Architecture)

Al implementar una consulta al backend, el agente debe separar estrictamente el flujo en tres capas utilizando inyección de dependencias clásicas en TypeScript/Node.js.

### 1.1 Capa de Infraestructura (Llamada Segura a HashiCorp Vault)
Las credenciales jamás se leen de variables planas. El repositorio debe inicializar el cliente de Vault usando el sufijo configurado.

```typescript
// backend/src/infrastructure/security/VaultPostRepository.ts
import { PostRepository } from '../../core/domain/PostRepository';
import { vaultClient } from './VaultClient';
import { database } from '../database/DatabaseConnection';

export class VaultPostRepository implements PostRepository {
  async getTotalPostsCount(): Promise<number> {
    // 1. Obtener la nomenclatura o sufijo seguro desde el entorno
    const secretPath = process.env.VAULT_POSTS_DB_PATH; 
    
    if (!secretPath) {
      throw new Error('La nomenclatura de Vault para la base de datos no está definida.');
    }
    
    // 2. Consultar de forma encriptada a HashiCorp Vault
    const credentials = await vaultClient.read(secretPath);
    
    // 3. Ejecutar la consulta física en la base de datos usando las credenciales seguras
    const totalCount = await database.query(credentials, 'SELECT COUNT(*) FROM posts');
    return totalCount;
  }
}
```

---

## 2. Patrón del Agente de Frontend (Angular con httpResource, Atomic Design & Browser Protection)

Al implementar la vista en el Frontend, el agente debe asegurar que el componente sea Standalone, use la API moderna de **`httpResource`** para gestionar peticiones HTTP de forma nativa mediante Signals, descarte el acoplamiento directo con RxJS innecesario, evite el uso de Shadow DOM y valide su diseño de forma aislada en Storybook.

### 2.1 Componente Atómico / Molécula (Reactividad Asíncrona con httpResource)
Se prohíbe el uso de suscripciones de RxJS o la conversión manual mediante `toSignal`. En su lugar, se inicializa `httpResource` pasando la URL del endpoint seguro provisto por el backend. Esto proporciona un Signal de solo lectura autogestionado.

```typescript
// frontend/src/app/presentation/components/molecules/post-counter/post-counter.component.ts
import { Component, ViewEncapsulation, httpResource } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-counter.component.html',
  styleUrls: ['./post-counter.component.css'],
  encapsulation: ViewEncapsulation.Emulated // Evita el uso de Shadow DOM nativo (Regla 1.3)
})
export class PostCounterComponent {
  // Inicialización nativa del recurso HTTP. 
  // Automáticamente genera un estado reactivo de Signals (value, isLoading, status, etc.)
  public postResource = httpResource<{ total: number }>('/api/v1/posts/count');
}
```

### 2.2 Plantilla HTML del Componente (Control de Estados Nativos del Recurso)
La plantilla lee los Signals internos expuestos por el objeto devuelto por `httpResource`. Se utiliza el flujo de control de Angular (`@if`/`@else`) interactuando con `.isLoading()` y `.value()`.

```html
<!-- frontend/src/app/presentation/components/molecules/post-counter/post-counter.component.html -->
<div class="post-counter-container">
  <span class="post-counter-label">Publicaciones Totales:</span>
  
  <!-- Evaluamos el estado de carga nativo del recurso HTTP -->
  @if (postResource.isLoading()) {
    <span class="post-counter-value loading">Cargando...</span>
  } @else {
    <!-- Accedemos de forma segura al valor del Signal mapeando la propiedad devuelta por el Backend -->
    <span class="post-counter-value">{{ postResource.value()?.total ?? 0 }}</span>
  }
</div>
```

### 2.3 Archivo de Storybook Mandatorio para Angular (`.stories.ts`)
Dado que `httpResource` utiliza el motor de peticiones nativo de Angular por debajo, interceptamos la llamada en Storybook utilizando proveedores HTTP simulados para mantener el componente aislado y testeable sin producción.

```typescript
// frontend/src/app/presentation/components/molecules/post-counter/post-counter.component.stories.ts
import { Meta, StoryObj, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { PostCounterComponent } from './post-counter.component';

const meta: Meta<typeof PostCounterComponent> = {
  title: 'Design System/Molecules/PostCounter',
  component: PostCounterComponent,
  decorators: [
    applicationConfig({
      providers: [
        // Proveemos el cliente HTTP necesario para httpResource con configuración aislada
        provideHttpClient() 
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof PostCounterComponent>;

export const Default: Story = {
  args: {},
};
```
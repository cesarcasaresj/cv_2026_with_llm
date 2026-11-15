import { applicationConfig } from '@storybook/angular-vite';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';

/**
 * Crea un "backend falso" para las stories: responde con lo que indique cada story
 * y nunca llama al backend real (constitution.md, sección 5).
 */
export function mockBackend(respond: HttpInterceptorFn) {
  return applicationConfig({ providers: [provideHttpClient(withInterceptors([respond]))] });
}

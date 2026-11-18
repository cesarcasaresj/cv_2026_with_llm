/** Estado que reciben los componentes de presentación: cada uno tiene su story (constitution.md, sección 5). */
export type ListState = 'loading' | 'error' | 'ready';

/**
 * Estado de un httpResource. Nunca lee value() en error: en Angular 22 lanzaría una excepción.
 */
export function stateOf(resource: { hasValue(): boolean; error(): unknown }): ListState {
  if (resource.hasValue()) return 'ready';
  return resource.error() ? 'error' : 'loading';
}

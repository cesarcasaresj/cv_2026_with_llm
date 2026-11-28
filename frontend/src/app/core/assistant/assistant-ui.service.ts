import { Injectable, signal } from '@angular/core';

/**
 * Estado visible de "Pregúntale a mi CV" (spec.md, HU-24), compartido entre el botón flotante
 * y la llamada a la acción del inicio: los dos abren el mismo panel.
 */
@Injectable({ providedIn: 'root' })
export class AssistantUiService {
  /** true cuando el backend confirma que el asistente funciona (tiene clave de la API). */
  readonly available = signal(false);
  readonly open = signal(false);
  /** true mientras el botón "Pregúntale a mi CV" del inicio está en pantalla: el flotante no se repite. */
  readonly heroButtonVisible = signal(false);
}

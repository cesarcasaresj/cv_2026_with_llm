import { Component, DestroyRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { I18nService } from '../../core/i18n/i18n.service';
import { AssistantService, MAX_QUESTIONS, type AssistantMessage } from '../../core/assistant/assistant.service';
import { AssistantUiService } from '../../core/assistant/assistant-ui.service';
import { CvAssistantComponent } from '../components/organisms/cv-assistant/cv-assistant.component';

/**
 * Contenedor de "Pregúntale a mi CV" (spec.md, HU-24): guarda la conversación (solo en memoria, en esta pestaña)
 * y llama al backend. El botón solo aparece en el navegador y si el backend dice que el asistente está disponible.
 */
@Component({
  imports: [CvAssistantComponent],
  selector: 'app-cv-assistant-host',
  template: `
    @if (available()) {
      <app-cv-assistant
        [name]="name()"
        [open]="open()"
        [messages]="messages()"
        [pending]="pending()"
        [error]="error()"
        [remaining]="remaining()"
        (openChange)="open.set($event)"
        (asked)="ask($event)"
        (restarted)="restart()"
        [hideLauncher]="ui.heroButtonVisible()"
        [linkedinUrl]="linkedinUrl()"
      />
    }
  `,
})
export class CvAssistantHostComponent {
  private readonly assistant = inject(AssistantService);
  private readonly i18n = inject(I18nService);

  /** Nombre de pila del autor, para el saludo. */
  readonly name = input.required<string>();
  /** Perfil de LinkedIn para el "siguiente paso" tras una respuesta. */
  readonly linkedinUrl = input<string | null>(null);

  // Compartidos con el inicio: su botón "Pregúntale a mi CV" abre este mismo panel
  protected readonly ui = inject(AssistantUiService);
  protected readonly available = this.ui.available;
  protected readonly open = this.ui.open;
  protected readonly messages = signal<AssistantMessage[]>([]);
  protected readonly pending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly remaining = computed(
    () => MAX_QUESTIONS - this.messages().filter((message) => message.role === 'user').length,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Solo en el navegador: el HTML del servidor no lleva el botón (evita pedir el estado en cada render)
    afterNextRender(() => {
      const subscription = this.assistant.status().subscribe({
        next: (status) => this.available.set(status.available),
        error: () => this.available.set(false),
      });
      destroyRef.onDestroy(() => subscription.unsubscribe());
    });
  }

  protected ask(question: string): void {
    if (this.pending() || this.remaining() <= 0) return;
    const conversation: AssistantMessage[] = [...this.messages(), { role: 'user', content: question }];
    this.messages.set(conversation);
    this.pending.set(true);
    this.error.set(null);

    this.assistant.ask({ lang: this.i18n.lang(), messages: conversation }).subscribe({
      next: ({ answer }) => {
        this.messages.update((current) => [...current, { role: 'assistant', content: answer }]);
        this.pending.set(false);
      },
      error: (failure: unknown) => {
        // La pregunta sin respuesta se quita: así se puede volver a enviar y la conversación sigue alternando
        this.messages.update((current) => current.slice(0, -1));
        this.pending.set(false);
        const text = this.i18n.t().assistant;
        this.error.set(failure instanceof HttpErrorResponse && failure.status === 429 ? text.errorLimit : text.errorGeneric);
      },
    });
  }

  protected restart(): void {
    this.messages.set([]);
    this.error.set(null);
  }
}

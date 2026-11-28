import { Component, ElementRef, afterRenderEffect, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AssistantOrbComponent } from '../../atoms/assistant-orb/assistant-orb.component';
import { MAX_QUESTION_LENGTH, type AssistantMessage } from '../../../../core/assistant/assistant.service';

/**
 * "Pregúntale a mi CV" (spec.md, HU-24): botón flotante y panel de chat. Es presentacional: muestra la
 * conversación que recibe y avisa de lo que pregunta la persona; la página hace las llamadas al backend.
 *
 * - El botón abre y cierra el panel; Esc lo cierra y el foco vuelve al botón.
 * - Las respuestas se anuncian (role="log", aria-live) y los errores con role="alert".
 * - Enter envía; Mayús + Enter hace un salto de línea.
 */
@Component({
  imports: [AssistantOrbComponent],
  selector: 'app-cv-assistant',
  templateUrl: './cv-assistant.component.html',
  styleUrl: './cv-assistant.component.css',
  host: { '(keydown.escape)': 'close()' },
})
export class CvAssistantComponent {
  protected readonly t = inject(I18nService).t;
  protected readonly maxLength = MAX_QUESTION_LENGTH;

  /** Nombre de pila del autor, para el saludo. */
  readonly name = input.required<string>();
  readonly open = input(false);
  readonly messages = input<AssistantMessage[]>([]);
  /** true mientras Claude responde. */
  readonly pending = input(false);
  readonly error = input<string | null>(null);
  /** Preguntas que quedan en esta conversación. */
  readonly remaining = input(6);
  /** true mientras se ve el botón del inicio: el flotante se esconde para no repetir el mismo llamado. */
  readonly hideLauncher = input(false);
  /** Enlaces del siguiente paso tras una respuesta: LinkedIn (si hay) y el PDF del CV. */
  readonly linkedinUrl = input<string | null>(null);
  readonly pdfUrl = input('/cv/Cesar_Casares_CV.pdf');

  readonly openChange = output<boolean>();
  readonly asked = output<string>();
  readonly restarted = output<void>();

  /** Cursor o foco en el botón: la esfera se activa. */
  protected readonly excited = signal(false);
  protected readonly draft = signal('');
  protected readonly hasAnswer = computed(() => this.messages().some((message) => message.role === 'assistant'));
  protected readonly canSend = computed(
    () => !this.pending() && this.remaining() > 0 && this.draft().trim().length > 0,
  );

  private readonly toggleButton = viewChild.required<ElementRef<HTMLButtonElement>>('launcher');
  private readonly field = viewChild<ElementRef<HTMLTextAreaElement>>('field');
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');

  constructor() {
    // Al abrir (cuando el panel ya está pintado), el foco va al campo de la pregunta
    afterRenderEffect(() => {
      this.field()?.nativeElement.focus();
    });
    // Cada mensaje nuevo (o el "escribiendo…") se ve sin hacer scroll a mano
    afterRenderEffect(() => {
      this.messages();
      this.pending();
      const log = this.log()?.nativeElement;
      if (log) log.scrollTop = log.scrollHeight;
    });
  }

  protected toggle(): void {
    this.openChange.emit(!this.open());
  }

  protected close(): void {
    if (!this.open()) return;
    this.openChange.emit(false);
    this.toggleButton().nativeElement.focus();
  }

  protected send(text = this.draft()): void {
    const question = text.trim();
    if (!question || this.pending() || this.remaining() <= 0) return;
    this.asked.emit(question.slice(0, MAX_QUESTION_LENGTH));
    this.draft.set('');
  }

  protected onFieldKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.send();
    }
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }
}

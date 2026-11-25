import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { components } from '../api/generated';

export type AssistantStatus = components['schemas']['AssistantStatus'];
export type AssistantMessage = components['schemas']['AssistantMessage'];
export type AssistantQuestion = components['schemas']['AssistantQuestion'];
export type AssistantAnswer = components['schemas']['AssistantAnswer'];

export const ASSISTANT_API = {
  status: '/api/v1/assistant',
  questions: '/api/v1/assistant/questions',
} as const;

/** Límites del asistente (spec.md, HU-24): los mismos que valida el backend. */
export const MAX_QUESTION_LENGTH = 500;
export const MAX_QUESTIONS = 6;

/**
 * "Pregúntale a mi CV" (spec.md, HU-24). El navegador solo envía la conversación: la clave de la API de Claude
 * vive en el backend y nunca llega aquí.
 */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);

  status(): Observable<AssistantStatus> {
    return this.http.get<AssistantStatus>(ASSISTANT_API.status);
  }

  ask(question: AssistantQuestion): Observable<AssistantAnswer> {
    return this.http.post<AssistantAnswer>(ASSISTANT_API.questions, question);
  }
}

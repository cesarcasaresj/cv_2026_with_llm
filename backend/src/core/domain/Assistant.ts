import type { Lang } from './Profile';

/** Turno de la conversación con el asistente "Pregúntale a mi CV" (spec.md, HU-24). */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Puerto hacia el modelo de lenguaje. La implementación (Claude) vive en infraestructura.
 * `cv` es el documento con los datos públicos del autor: lo único que el asistente sabe de él.
 */
export interface CvAssistant {
  answer(cv: string, conversation: ChatTurn[], lang: Lang): Promise<string>;
}

export type QuotaExceeded = 'visitor' | 'daily';

/** Puerto del límite de preguntas: protege el saldo de la API frente a abusos. */
export interface QuestionQuota {
  /** Descuenta una pregunta del visitante. Devuelve null si puede preguntar, o qué límite alcanzó. */
  take(visitor: string): QuotaExceeded | null;
}

// "Pregúntale a mi CV" (spec.md, HU-24): valida la conversación, aplica los límites y arma el CV que ve el modelo.
import type { ChatTurn, CvAssistant, QuestionQuota } from '../domain/Assistant';
import type { Lang, Project } from '../domain/Profile';
import { TooManyRequestsError, ValidationError } from '../domain/errors';
import type { GetProfile, ListProjects, PublicProfile } from './Portfolio';

export const MAX_QUESTION_LENGTH = 500;
export const MAX_ANSWER_LENGTH = 2000;
export const MAX_QUESTIONS_PER_CONVERSATION = 6;

export interface PublicLinks {
  github: string | null;
  linkedin: string | null;
}

/** La conversación cumple las reglas: alterna visitante / asistente, empieza y termina con una pregunta. */
export function validateConversation(conversation: unknown): ChatTurn[] {
  if (!Array.isArray(conversation) || conversation.length === 0) {
    throw new ValidationError('Escribe una pregunta.');
  }
  if (conversation.length > MAX_QUESTIONS_PER_CONVERSATION * 2 - 1) {
    throw new ValidationError(`Cada conversación admite ${MAX_QUESTIONS_PER_CONVERSATION} preguntas. Empieza una nueva.`);
  }
  // Alterna empezando por el visitante: con un número impar de turnos, el último es una pregunta
  if (conversation.length % 2 === 0) {
    throw new ValidationError('La conversación no tiene el formato esperado.');
  }
  return conversation.map((turn: unknown, index): ChatTurn => {
    const expected = index % 2 === 0 ? 'user' : 'assistant';
    const { role, content } = (turn ?? {}) as Partial<ChatTurn>;
    const text = typeof content === 'string' ? content.trim() : '';
    if (role !== expected || text.length === 0) {
      throw new ValidationError('La conversación no tiene el formato esperado.');
    }
    if (role === 'user' && text.length > MAX_QUESTION_LENGTH) {
      throw new ValidationError(`Cada pregunta puede tener como máximo ${MAX_QUESTION_LENGTH} caracteres.`);
    }
    if (role === 'assistant' && text.length > MAX_ANSWER_LENGTH) {
      throw new ValidationError('La conversación no tiene el formato esperado.');
    }
    return { role, content: text };
  });
}

/** El CV que recibe el modelo: solo los datos públicos que ya muestra el sitio, en un orden estable (caché). */
export function cvDocument(profile: PublicProfile, projects: Project[], links: PublicLinks): string {
  const lines = [`# ${profile.name}`, profile.headline];
  if (profile.location) lines.push(`Location: ${profile.location}`);
  if (links.linkedin) lines.push(`LinkedIn: ${links.linkedin}`);
  if (links.github) lines.push(`GitHub: ${links.github}`);

  lines.push('', '## About', ...profile.about);

  lines.push('', '## Experience (most recent first)');
  for (const position of profile.experience) {
    const period = `${position.startedOn} – ${position.finishedOn ?? 'present'}`;
    lines.push('', `### ${position.title} · ${position.company} (${period})`);
    if (position.location) lines.push(`Location: ${position.location}`);
    if (position.description) lines.push(position.description);
  }

  if (projects.length > 0) {
    lines.push('', '## Public projects (GitHub)');
    for (const project of [...projects].sort((a, b) => a.name.localeCompare(b.name))) {
      const details = [project.language, project.description].filter(Boolean).join(' · ');
      lines.push(`- ${project.name}${details ? `: ${details}` : ''} (${project.url})`);
    }
  }
  return lines.join('\n');
}

export class AskAboutCv {
  constructor(
    private readonly getProfile: GetProfile,
    private readonly listProjects: ListProjects,
    private readonly links: PublicLinks,
    private readonly assistant: CvAssistant,
    private readonly quota: QuestionQuota,
  ) {}

  async execute(visitor: string, lang: Lang, conversation: unknown): Promise<string> {
    const turns = validateConversation(conversation);

    const exceeded = this.quota.take(visitor);
    if (exceeded === 'visitor') {
      throw new TooManyRequestsError('Hiciste muchas preguntas seguidas. Vuelve a intentarlo dentro de una hora.');
    }
    if (exceeded === 'daily') {
      throw new TooManyRequestsError('El asistente alcanzó su límite de hoy. Vuelve a intentarlo mañana.');
    }

    const profile = await this.getProfile.execute(lang);
    // Sin GitHub, el asistente responde igual con el perfil
    const projects = await this.listProjects.execute().catch(() => []);
    return this.assistant.answer(cvDocument(profile, projects, this.links), turns, lang);
  }
}

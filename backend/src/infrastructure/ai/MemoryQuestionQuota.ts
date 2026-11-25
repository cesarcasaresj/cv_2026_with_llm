import type { QuestionQuota, QuotaExceeded } from '../../core/domain/Assistant';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Límite de preguntas en memoria (spec.md, HU-24): N por visitante y hora y un tope diario global.
 * Con un solo servidor basta; los contadores vuelven a cero si el backend se reinicia (el tope de gasto
 * mensual de la consola de Anthropic es la red de seguridad final).
 */
export class MemoryQuestionQuota implements QuestionQuota {
  private readonly perVisitor = new Map<string, number[]>();
  private day = '';
  private usedToday = 0;

  constructor(
    private readonly perVisitorPerHour: number,
    private readonly dailyLimit: number,
    private readonly now: () => number = Date.now,
  ) {}

  take(visitor: string): QuotaExceeded | null {
    const now = this.now();
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.usedToday = 0;
      this.perVisitor.clear();
    }
    if (this.usedToday >= this.dailyLimit) return 'daily';

    const recent = (this.perVisitor.get(visitor) ?? []).filter((time) => now - time < HOUR_MS);
    if (recent.length >= this.perVisitorPerHour) {
      this.perVisitor.set(visitor, recent);
      return 'visitor';
    }
    recent.push(now);
    this.perVisitor.set(visitor, recent);
    this.usedToday += 1;
    return null;
  }
}

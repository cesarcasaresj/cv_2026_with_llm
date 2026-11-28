/**
 * Freno progresivo contra la fuerza bruta en el login (por visitante, en memoria).
 *
 * - Los primeros `freeAttempts` fallos no tienen castigo (alguien que se equivoca al escribir).
 * - Desde ahí, cada fallo bloquea al visitante un tiempo que se duplica: 1 min, 2, 4… hasta `maxBlockMs`.
 * - Un login correcto borra el historial. Los fallos se olvidan pasado `forgetAfterMs` sin intentos.
 *
 * No se bloquea por cuenta (correo): con un solo autor, cualquiera podría dejarlo fuera a propósito.
 * Al ser memoria del proceso, un reinicio lo vacía; para un solo servidor es suficiente.
 */
export interface LoginThrottleOptions {
  freeAttempts: number;
  baseBlockMs: number;
  maxBlockMs: number;
  forgetAfterMs: number;
}

const DEFAULTS: LoginThrottleOptions = {
  freeAttempts: 5,
  baseBlockMs: 60_000,
  maxBlockMs: 60 * 60_000,
  forgetAfterMs: 24 * 60 * 60_000,
};

interface Entry {
  failures: number;
  blockedUntil: number;
  lastFailure: number;
}

export class LoginThrottle {
  private readonly entries = new Map<string, Entry>();
  private readonly options: LoginThrottleOptions;

  constructor(
    options: Partial<LoginThrottleOptions> = {},
    private readonly now: () => number = Date.now,
  ) {
    this.options = { ...DEFAULTS, ...options };
  }

  /** Milisegundos que le quedan de bloqueo al visitante, o 0 si puede intentarlo. */
  retryAfterMs(visitor: string): number {
    const entry = this.current(visitor);
    return entry ? Math.max(0, entry.blockedUntil - this.now()) : 0;
  }

  recordFailure(visitor: string): void {
    const now = this.now();
    const entry = this.current(visitor) ?? { failures: 0, blockedUntil: 0, lastFailure: now };
    entry.failures += 1;
    entry.lastFailure = now;

    const excess = entry.failures - this.options.freeAttempts;
    if (excess > 0) {
      const block = Math.min(this.options.baseBlockMs * 2 ** (excess - 1), this.options.maxBlockMs);
      entry.blockedUntil = now + block;
    }
    this.entries.set(visitor, entry);
    this.prune(now);
  }

  recordSuccess(visitor: string): void {
    this.entries.delete(visitor);
  }

  private current(visitor: string): Entry | undefined {
    const entry = this.entries.get(visitor);
    if (entry && this.now() - entry.lastFailure > this.options.forgetAfterMs) {
      this.entries.delete(visitor);
      return undefined;
    }
    return entry;
  }

  /** Evita que la tabla crezca sin fin si llegan muchas IP distintas. */
  private prune(now: number): void {
    if (this.entries.size < 10_000) return;
    for (const [visitor, entry] of this.entries) {
      if (now - entry.lastFailure > this.options.forgetAfterMs || entry.blockedUntil < now) this.entries.delete(visitor);
    }
  }
}

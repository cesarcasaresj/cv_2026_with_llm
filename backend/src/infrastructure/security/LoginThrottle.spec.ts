import { describe, expect, it } from 'vitest';
import { LoginThrottle } from './LoginThrottle';

function setup() {
  let now = 0;
  const throttle = new LoginThrottle({ freeAttempts: 3, baseBlockMs: 1000, maxBlockMs: 5000, forgetAfterMs: 60_000 }, () => now);
  return { throttle, advance: (ms: number) => (now += ms) };
}

describe('LoginThrottle', () => {
  it('los primeros fallos no bloquean', () => {
    const { throttle } = setup();
    for (let i = 0; i < 3; i++) throttle.recordFailure('ip');

    expect(throttle.retryAfterMs('ip')).toBe(0);
  });

  it('desde ahí el bloqueo se duplica en cada fallo, con un máximo', () => {
    const { throttle, advance } = setup();
    for (let i = 0; i < 3; i++) throttle.recordFailure('ip');

    const blocks: number[] = [];
    for (let i = 0; i < 5; i++) {
      throttle.recordFailure('ip');
      blocks.push(throttle.retryAfterMs('ip'));
      advance(blocks.at(-1)!);
    }

    expect(blocks).toEqual([1000, 2000, 4000, 5000, 5000]);
  });

  it('el bloqueo vence con el tiempo', () => {
    const { throttle, advance } = setup();
    for (let i = 0; i < 4; i++) throttle.recordFailure('ip');
    advance(400);

    expect(throttle.retryAfterMs('ip')).toBe(600);
    advance(600);
    expect(throttle.retryAfterMs('ip')).toBe(0);
  });

  it('un login correcto borra el historial', () => {
    const { throttle } = setup();
    for (let i = 0; i < 4; i++) throttle.recordFailure('ip');
    throttle.recordSuccess('ip');

    throttle.recordFailure('ip');
    expect(throttle.retryAfterMs('ip')).toBe(0);
  });

  it('cada visitante lleva su propia cuenta', () => {
    const { throttle } = setup();
    for (let i = 0; i < 4; i++) throttle.recordFailure('atacante');

    expect(throttle.retryAfterMs('atacante')).toBeGreaterThan(0);
    expect(throttle.retryAfterMs('autor')).toBe(0);
  });

  it('los fallos antiguos se olvidan', () => {
    const { throttle, advance } = setup();
    for (let i = 0; i < 3; i++) throttle.recordFailure('ip');
    advance(60_001);

    throttle.recordFailure('ip');
    expect(throttle.retryAfterMs('ip')).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { MemoryQuestionQuota } from './MemoryQuestionQuota';

describe('MemoryQuestionQuota (HU-24)', () => {
  it('limita las preguntas por visitante y hora', () => {
    let now = Date.parse('2026-11-24T10:00:00Z');
    const quota = new MemoryQuestionQuota(2, 100, () => now);
    expect(quota.take('a')).toBeNull();
    expect(quota.take('a')).toBeNull();
    expect(quota.take('a')).toBe('visitor');
    expect(quota.take('b')).toBeNull();
    now += 60 * 60 * 1000;
    expect(quota.take('a')).toBeNull();
  });

  it('aplica un tope diario global que vuelve a cero al día siguiente', () => {
    let now = Date.parse('2026-11-24T22:00:00Z');
    const quota = new MemoryQuestionQuota(10, 2, () => now);
    expect(quota.take('a')).toBeNull();
    expect(quota.take('b')).toBeNull();
    expect(quota.take('c')).toBe('daily');
    now = Date.parse('2026-11-25T00:00:01Z');
    expect(quota.take('c')).toBeNull();
  });
});

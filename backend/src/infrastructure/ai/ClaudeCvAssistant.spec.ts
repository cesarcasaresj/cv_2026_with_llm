import { describe, expect, it, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { ASSISTANT_MODEL, ClaudeCvAssistant, systemPrompt } from './ClaudeCvAssistant';
import { ServiceUnavailableError } from '../../core/domain/errors';

/** Cliente falso: no llama a la API ni gasta saldo. */
function fakeClient(create: (params: unknown) => Promise<unknown>) {
  const spy = vi.fn(create);
  return { client: { beta: { messages: { create: spy } } } as unknown as Anthropic, spy };
}

const usage = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0 };
const conversation = [{ role: 'user' as const, content: '¿Qué hizo en BBVA?' }];

describe('ClaudeCvAssistant (HU-24)', () => {
  it('pide a Claude Opus 5.5 con esfuerzo bajo, fallbacks y el CV en un system cacheado', async () => {
    const { client, spy } = fakeClient(async () => ({
      stop_reason: 'end_turn',
      usage,
      content: [
        { type: 'thinking', thinking: '' },
        { type: 'text', text: ' Lidera la capa de seguridad. ' },
      ],
    }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const answer = await new ClaudeCvAssistant('clave', client).answer('CV', conversation, 'es');
    log.mockRestore();

    expect(answer).toBe('Lidera la capa de seguridad.');
    expect(spy.mock.calls[0][0]).toMatchObject({
      model: ASSISTANT_MODEL,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: systemPrompt('CV', 'es'), cache_control: { type: 'ephemeral' } }],
      messages: conversation,
    });
  });

  it('si el modelo declina, responde con un mensaje amable en el idioma pedido', async () => {
    const { client } = fakeClient(async () => ({ stop_reason: 'refusal', usage, content: [] }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await expect(new ClaudeCvAssistant('clave', client).answer('CV', conversation, 'en')).resolves.toContain(
      "I'd rather not answer that",
    );
    log.mockRestore();
  });

  it('un error de la API se convierte en 503 y el registro no incluye la pregunta', async () => {
    const { client } = fakeClient(async () => {
      throw new Anthropic.APIConnectionError({ message: 'sin red' });
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(new ClaudeCvAssistant('clave', client).answer('CV', conversation, 'es')).rejects.toThrow(
      ServiceUnavailableError,
    );
    expect(error.mock.calls.flat().join(' ')).not.toContain('BBVA');
    error.mockRestore();
  });

  it('el system fija el idioma de respaldo y lleva el CV entre etiquetas', () => {
    const prompt = systemPrompt('DATOS', 'en');
    expect(prompt).toContain('reply in English');
    expect(prompt).toContain('<cv>\nDATOS\n</cv>');
  });
});

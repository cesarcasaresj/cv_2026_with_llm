import { describe, expect, it } from 'vitest';
import { addScriptNonce } from './security-headers';

describe('addScriptNonce', () => {
  it('pone el nonce a todos los <script>, en línea o con src', () => {
    const html = '<script>a()</script><script type="module" src="main.js"></script><script id="x" type="application/json">{}</script>';

    const result = addScriptNonce(html, 'abc');

    expect(result.match(/<script nonce="abc"/g)).toHaveLength(3);
  });

  it('no duplica un nonce que ya existe', () => {
    expect(addScriptNonce('<script nonce="otro">a()</script>', 'abc')).toBe('<script nonce="otro">a()</script>');
  });

  it('no toca etiquetas que solo empiezan igual', () => {
    expect(addScriptNonce('<scripts></scripts>', 'abc')).toBe('<scripts></scripts>');
  });
});

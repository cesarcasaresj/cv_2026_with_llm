import { describe, expect, it } from 'vitest';
import { MarkedMarkdownRenderer } from './MarkedMarkdownRenderer';

describe('MarkedMarkdownRenderer', () => {
  const renderer = new MarkedMarkdownRenderer();

  it('convierte # en <h2>: el único <h1> de la página es el título (HU-13)', () => {
    expect(renderer.render('# Sección')).toContain('<h2');
    expect(renderer.render('# Sección')).not.toContain('<h1');
  });

  it('baja también los niveles inferiores y no pasa de <h6>', () => {
    expect(renderer.render('## Subsección')).toContain('<h3');
    expect(renderer.render('###### Mínimo')).toContain('<h6');
  });

  it('convierte párrafos y enlaces', () => {
    const html = renderer.render('Lee la [guía de accesibilidad](https://www.w3.org/WAI/).');

    expect(html).toContain('<p>');
    expect(html).toContain('<a href="https://www.w3.org/WAI/">guía de accesibilidad</a>');
  });
});

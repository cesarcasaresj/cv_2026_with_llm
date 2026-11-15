import { describe, expect, it } from 'vitest';
import { parseArticle } from './articleSource';

const VALID = `---
title: Un artículo de prueba completo
description: Descripción de prueba con longitud suficiente para cumplir la regla de SEO del spec.
category: Arquitectura
tags: [OpenAPI, TypeScript]
status: published
publishedAt: 2026-11-15
cover:
  file: portada.svg
  alt: Diagrama del contrato entre frontend y backend
---

# Introducción

Texto del artículo.
`;

function withFrontMatter(replace: string, by: string): string {
  return VALID.replace(replace, by);
}

describe('parseArticle', () => {
  it('acepta un artículo publicado completo', () => {
    const result = parseArticle('mi-articulo', VALID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.article.tags).toEqual(['OpenAPI', 'TypeScript']);
      expect(result.article.publishedAt?.toISOString()).toBe('2026-11-15T00:00:00.000Z');
      expect(result.article.bodyMarkdown.startsWith('# Introducción')).toBe(true);
    }
  });

  it('rechaza un nombre de archivo que no es slug', () => {
    expect(parseArticle('Mi Artículo', VALID).ok).toBe(false);
  });

  it('exige descripción de 50 a 160 caracteres', () => {
    const result = parseArticle('mi-articulo', withFrontMatter(/description: .*\n/.exec(VALID)![0], 'description: Corta\n'));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join()).toContain('description');
  });

  it('exige alt en la portada salvo que sea decorativa (HU-13)', () => {
    const sinAlt = withFrontMatter('  alt: Diagrama del contrato entre frontend y backend\n', '');
    const decorativa = withFrontMatter('  alt: Diagrama del contrato entre frontend y backend\n', '  decorative: true\n');

    expect(parseArticle('mi-articulo', sinAlt).ok).toBe(false);
    expect(parseArticle('mi-articulo', decorativa).ok).toBe(true);
  });

  it('no permite más de 10 etiquetas ni repetidas', () => {
    const once = withFrontMatter('tags: [OpenAPI, TypeScript]', `tags: [${Array.from({ length: 11 }, (_, i) => `Etiqueta ${i}`).join(', ')}]`);
    const repetidas = withFrontMatter('tags: [OpenAPI, TypeScript]', 'tags: [Diseño, diseno]');

    expect(parseArticle('mi-articulo', once).ok).toBe(false);
    expect(parseArticle('mi-articulo', repetidas).ok).toBe(false);
  });

  it('permite un borrador sin descripción ni fecha', () => {
    const borrador = `---\ntitle: Un borrador todavía sin terminar\ncategory: Notas\n---\n`;

    expect(parseArticle('borrador', borrador).ok).toBe(true);
  });
});

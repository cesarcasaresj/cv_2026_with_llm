import { Injectable, InjectionToken, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import type { components } from '../api/generated';

type ArticleDetail = components['schemas']['ArticleDetail'];

export const SITE_NAME = 'CV 2026';

/**
 * Origen público del sitio para las URLs absolutas (canonical, og:url, og:image).
 * Por defecto, el origen de la página; el servidor SSR lo fija con PUBLIC_SITE_URL (app.config.server.ts).
 */
export const SITE_URL = new InjectionToken<string>('SITE_URL', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).location?.origin ?? '',
});

export interface PageSeo {
  /** Título sin el nombre del sitio: el servicio añade " · CV 2026". */
  title: string;
  description: string;
  /** Ruta de la página, por ejemplo "/" o "/articulos/mi-articulo". */
  path: string;
  /** true en páginas que no deben aparecer en buscadores (login, cuenta, no encontrado). */
  noindex?: boolean;
}

const JSON_LD_ID = 'jsonld-article';

/**
 * Etiquetas que leen buscadores y redes sociales (spec.md, HU-12).
 * Cada página llama a setPage o setArticle; así no quedan restos de la página anterior al navegar.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly siteUrl = inject(SITE_URL).replace(/\/+$/, '');

  setPage(page: PageSeo): void {
    this.removeArticleTags();
    this.setJsonLd(null);
    this.setCommon(page, 'website');
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
  }

  setArticle(article: ArticleDetail): void {
    const path = `/articulos/${article.slug}`;
    const image = article.cover ? this.absolute(article.cover.fallback) : null;

    this.removeArticleTags();
    this.setCommon({ title: article.seoTitle ?? article.title, description: article.description, path }, 'article');

    this.meta.updateTag({ property: 'og:title', content: article.title });
    this.meta.updateTag({ name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' });
    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ property: 'og:image:alt', content: article.cover!.alt });
      this.meta.updateTag({ name: 'twitter:image', content: image });
    }
    this.meta.updateTag({ property: 'article:published_time', content: article.publishedAt });
    this.meta.updateTag({ property: 'article:modified_time', content: article.updatedAt });
    this.meta.updateTag({ property: 'article:section', content: article.category.name });
    for (const tag of article.tags) {
      this.meta.addTag({ property: 'article:tag', content: tag.name });
    }

    // Datos estructurados schema.org (spec.md, HU-12)
    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.description,
      ...(image ? { image: [image] } : {}),
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: { '@type': 'Person', name: article.author.name },
      articleSection: article.category.name,
      keywords: article.tags.map((tag) => tag.name).join(', '),
      inLanguage: 'es',
      mainEntityOfPage: { '@type': 'WebPage', '@id': this.absolute(path) },
    });
  }

  private setCommon(page: PageSeo, type: 'website' | 'article'): void {
    const fullTitle = `${page.title} · ${SITE_NAME}`;
    const url = this.absolute(page.path);

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: page.description });
    if (page.noindex) this.meta.updateTag({ name: 'robots', content: 'noindex' });
    else this.meta.removeTag('name="robots"');

    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:locale', content: 'es_ES' });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: page.description });

    this.setCanonical(url);
  }

  private removeArticleTags(): void {
    for (const selector of [
      'property="og:image"',
      'property="og:image:alt"',
      'name="twitter:image"',
      'property="article:published_time"',
      'property="article:modified_time"',
      'property="article:section"',
    ]) {
      this.meta.removeTag(selector);
    }
    for (const tag of this.meta.getTags('property="article:tag"')) {
      this.meta.removeTagElement(tag);
    }
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: Record<string, unknown> | null): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
    if (!data) return;

    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    // "<" escapado: el texto del artículo nunca puede cerrar la etiqueta <script>
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }

  private absolute(path: string): string {
    return /^https?:\/\//.test(path) ? path : `${this.siteUrl}${path}`;
  }
}

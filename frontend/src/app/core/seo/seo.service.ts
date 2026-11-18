import { Injectable, InjectionToken, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import type { components } from '../api/generated';
import { I18nService } from '../i18n/i18n.service';

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

const JSON_LD_ARTICLE = 'jsonld-article';
const JSON_LD_PERSON = 'jsonld-person';

/** Lo que la portada sabe de su autor para los datos estructurados Person (spec.md, HU-14). */
export interface PersonSeo {
  name: string;
  headline: string;
  location: string | null;
  sameAs: string[];
}

/**
 * Etiquetas que leen buscadores y redes sociales (spec.md, HU-12).
 * Cada página llama a setPage o setArticle; así no quedan restos de la página anterior al navegar.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  private readonly siteUrl = inject(SITE_URL).replace(/\/+$/, '');

  setPage(page: PageSeo): void {
    this.removeArticleTags();
    this.setJsonLd(JSON_LD_ARTICLE, null);
    this.setJsonLd(JSON_LD_PERSON, null);
    this.setCommon(page, 'website');
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
  }

  /** Portada: página normal más los datos estructurados de la persona (schema.org Person). */
  setPortfolio(page: PageSeo, person: PersonSeo): void {
    this.setPage(page);
    this.setJsonLd(JSON_LD_PERSON, {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: person.name,
      jobTitle: person.headline,
      url: this.absolute('/'),
      ...(person.location ? { homeLocation: { '@type': 'Place', name: person.location } } : {}),
      ...(person.sameAs.length ? { sameAs: person.sameAs } : {}),
    });
  }

  setArticle(article: ArticleDetail): void {
    const path = `/articulos/${article.slug}`;
    const image = article.cover ? this.absolute(article.cover.fallback) : null;

    this.removeArticleTags();
    this.setJsonLd(JSON_LD_PERSON, null);
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
    this.setJsonLd(JSON_LD_ARTICLE, {
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
      // El idioma del artículo, no el de la interfaz: los artículos no se traducen (HU-18)
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
    this.meta.updateTag({ property: 'og:locale', content: this.i18n.t().seo.locale });
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

  private setJsonLd(id: string, data: Record<string, unknown> | null): void {
    this.document.getElementById(id)?.remove();
    if (!data) return;

    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    // "<" escapado: el texto del artículo nunca puede cerrar la etiqueta <script>
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
    this.document.head.appendChild(script);
  }

  private absolute(path: string): string {
    return /^https?:\/\//.test(path) ? path : `${this.siteUrl}${path}`;
  }
}

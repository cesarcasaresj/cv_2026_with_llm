import { Component, inject, input } from '@angular/core';
import type { Project } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { RevealDirective } from '../../../motion/reveal.directive';
import { TiltDirective } from '../../../motion/tilt.directive';
import { SectionHeadingComponent } from '../../atoms/section-heading/section-heading.component';
import { I18nService } from '../../../../core/i18n/i18n.service';
import type { Lang } from '../../../../core/i18n/lang';

/** Colores de los lenguajes más comunes (los mismos que usa GitHub); el resto, violeta. */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Go: '#00add8',
  Python: '#3572a5',
  HTML: '#e34c26',
  CSS: '#663399',
  Java: '#b07219',
  'C#': '#178600',
  Rust: '#dea584',
  Shell: '#89e051',
};

/** Un formateador por idioma: crearlo cuesta y el resultado no cambia. */
const relativeFormats: Partial<Record<Lang, Intl.RelativeTimeFormat>> = {};

/**
 * "hace 3 días", "el mes pasado" / "3 days ago", "last month"… a partir de una fecha ISO.
 * Intl.RelativeTimeFormat es nativo del navegador y de Node: no hace falta ninguna librería.
 */
export function updatedAgo(iso: string, lang: Lang, justNow: string, now = Date.now()): string {
  const relative = (relativeFormats[lang] ??= new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }));
  const seconds = (new Date(iso).getTime() - now) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return justNow;
}

/** Repositorios públicos de GitHub (spec.md, HU-16). */
@Component({
  imports: [RevealDirective, TiltDirective, SectionHeadingComponent],
  selector: 'app-project-grid',
  templateUrl: './project-grid.component.html',
  styleUrl: './project-grid.component.css',
})
export class ProjectGridComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly lang = this.i18n.lang;

  readonly projects = input<Project[] | null>(null);
  readonly state = input.required<ListState>();
  readonly githubUrl = input<string | null>(null);

  protected readonly updatedAgo = updatedAgo;

  protected languageColor(language: string | null): string {
    return (language && LANGUAGE_COLORS[language]) || '#7c5cff';
  }

  /** "practice-node-api-express" → "practice node api express": se lee mejor en una tarjeta. */
  protected displayName(name: string): string {
    return name.replace(/[-_]+/g, ' ');
  }
}

import { Component, computed, inject, input } from '@angular/core';
import type { Profile } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { RevealDirective } from '../../../motion/reveal.directive';
import { SectionHeadingComponent } from '../../atoms/section-heading/section-heading.component';
import { I18nService } from '../../../../core/i18n/i18n.service';

interface Stat {
  value: string;
  label: string;
}

/** "Acerca de mí" con algunas cifras calculadas de la experiencia (spec.md, HU-14). */
@Component({
  imports: [RevealDirective, SectionHeadingComponent],
  selector: 'app-about-section',
  templateUrl: './about-section.component.html',
  styleUrl: './about-section.component.css',
})
export class AboutSectionComponent {
  protected readonly t = inject(I18nService).t;

  readonly profile = input<Profile | null>(null);
  readonly state = input.required<ListState>();
  /** Número de proyectos públicos, o null si aún no se conoce. */
  readonly projectCount = input<number | null>(null);

  protected readonly stats = computed<Stat[]>(() => {
    const profile = this.profile();
    if (!profile) return [];
    const text = this.t().about;

    const stats: Stat[] = [];
    const firstYear = profile.experience.map((p) => Number(p.startedOn.slice(0, 4))).sort()[0];
    if (firstYear) {
      const years = new Date().getUTCFullYear() - firstYear;
      stats.push({ value: `${Math.max(years, 1)}+`, label: text.years(years) });
    }
    const companies = new Set(profile.experience.map((p) => p.company)).size;
    if (companies) stats.push({ value: String(companies), label: text.companies(companies) });
    const projects = this.projectCount();
    if (projects) stats.push({ value: String(projects), label: text.projects(projects) });
    return stats;
  });
}

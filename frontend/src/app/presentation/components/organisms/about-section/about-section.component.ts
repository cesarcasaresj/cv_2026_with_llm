import { Component, computed, inject, input } from '@angular/core';
import type { Profile } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { SectionHeadingComponent } from '../../atoms/section-heading/section-heading.component';
import { PlayerCardComponent } from '../../molecules/player-card/player-card.component';
import { DialogueBoxComponent } from '../../molecules/dialogue-box/dialogue-box.component';
import { LevelStatComponent } from '../../molecules/level-stat/level-stat.component';
import { I18nService } from '../../../../core/i18n/i18n.service';

/** Retrato de la tarjeta (public/images/perfil): cesar-400.avif, cesar-800.webp… */
const PORTRAIT = '/images/perfil/cesar';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  achievement: string;
  badge: string;
  variant: 'level' | 'open-source';
  href: string | null;
}

/**
 * "Acerca de mí" como pantalla de personaje de videojuego (spec.md, HU-14 y HU-23):
 * tarjeta 3D de papel, el texto en una caja de diálogo y las cifras como subidas de nivel.
 */
@Component({
  imports: [SectionHeadingComponent, PlayerCardComponent, DialogueBoxComponent, LevelStatComponent],
  selector: 'app-about-section',
  templateUrl: './about-section.component.html',
  styleUrl: './about-section.component.css',
})
export class AboutSectionComponent {
  protected readonly t = inject(I18nService).t;
  protected readonly portrait = PORTRAIT;

  readonly profile = input<Profile | null>(null);
  readonly state = input.required<ListState>();
  /** Número de proyectos públicos, o null si aún no se conoce. */
  readonly projectCount = input<number | null>(null);

  /** Años desde el primer puesto (al menos 1), o null sin experiencia. */
  private readonly years = computed(() => {
    const firstYear = this.profile()
      ?.experience.map((p) => Number(p.startedOn.slice(0, 4)))
      .sort()[0];
    return firstYear ? Math.max(new Date().getUTCFullYear() - firstYear, 1) : null;
  });

  /** Clase del personaje: la primera parte del titular ("Frontend Engineer · Angular…" → "Frontend Engineer"). */
  protected readonly role = computed(() => this.profile()?.headline.split('·')[0].trim() ?? '');

  protected readonly stats = computed<Stat[]>(() => {
    const profile = this.profile();
    if (!profile) return [];
    const text = this.t().about;

    const stats: Stat[] = [];
    const years = this.years();
    if (years) {
      stats.push({
        value: years,
        suffix: '+',
        label: text.years(years),
        achievement: text.yearsAchievement(years),
        badge: text.levelUp,
        variant: 'level',
        href: null,
      });
    }
    const companies = new Set(profile.experience.map((p) => p.company)).size;
    if (companies) {
      stats.push({
        value: companies,
        suffix: '',
        label: text.companies(companies),
        achievement: text.companiesAchievement(companies),
        badge: text.levelUp,
        variant: 'level',
        href: null,
      });
    }
    const projects = this.projectCount();
    if (projects) {
      stats.push({
        value: projects,
        suffix: '',
        label: text.projects(projects),
        achievement: text.openSourceAchievement,
        badge: text.openSource,
        variant: 'open-source',
        href: profile.links.github ?? null,
      });
    }
    return stats;
  });

  protected readonly level = computed(() => this.years());
}

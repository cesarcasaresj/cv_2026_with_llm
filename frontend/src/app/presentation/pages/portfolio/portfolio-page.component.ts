import { Component, computed, effect, inject, linkedSignal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/seo/seo.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { SectionPortalService } from '../../portal/section-portal.service';
import { type ListState, stateOf } from '../../../core/http/resource-state';
import { PORTFOLIO_API, type Profile, type Project, type ProfileUpdate } from '../../../core/portfolio/portfolio.types';
import { HeroSectionComponent } from '../../components/organisms/hero-section/hero-section.component';
import { ExperienceJourneyComponent } from '../../components/organisms/experience-journey/experience-journey.component';
import { AboutSectionComponent } from '../../components/organisms/about-section/about-section.component';
import { ProjectGridComponent } from '../../components/organisms/project-grid/project-grid.component';
import { UpdateFeedComponent } from '../../components/organisms/update-feed/update-feed.component';
import { RevealDirective } from '../../motion/reveal.directive';
import { CvAssistantHostComponent } from '../../assistant/cv-assistant-host.component';

/**
 * Portada (spec.md, HU-14 a HU-17): inicio, experiencia, acerca de mí, proyectos y actualidad.
 * Se renderiza en el servidor: buscadores y redes sociales reciben el contenido completo.
 */
@Component({
  imports: [
    RouterLink,
    RevealDirective,
    HeroSectionComponent,
    ExperienceJourneyComponent,
    AboutSectionComponent,
    ProjectGridComponent,
    UpdateFeedComponent,
    CvAssistantHostComponent,
  ],
  selector: 'app-portfolio-page',
  templateUrl: './portfolio-page.component.html',
  styleUrl: './portfolio-page.component.css',
})
export class PortfolioPageComponent {
  private readonly seo = inject(SeoService);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  /** El perfil en el idioma activo: al cambiar de idioma se pide de nuevo (HU-18). */
  protected readonly profile = httpResource<Profile>(() => `${PORTFOLIO_API.profile}?lang=${this.i18n.lang()}`);
  protected readonly projects = httpResource<Project[]>(() => PORTFOLIO_API.projects);
  protected readonly updates = httpResource<ProfileUpdate[]>(() => PORTFOLIO_API.updates);

  /**
   * Último perfil recibido. Mientras llega el del otro idioma se sigue mostrando este,
   * así la portada no parpadea con "Cargando…" al cambiar de idioma.
   */
  protected readonly loadedProfile = linkedSignal<Profile | null, Profile | null>({
    source: () => (this.profile.hasValue() ? this.profile.value() : null),
    computation: (current, previous) => current ?? (this.profile.error() ? null : (previous?.value ?? null)),
  });

  protected readonly profileState = computed<ListState>(() => (this.loadedProfile() ? 'ready' : stateOf(this.profile)));
  protected readonly projectsState = computed(() => stateOf(this.projects));
  protected readonly updatesState = computed(() => stateOf(this.updates));
  /** Actualidad cargada y vacía. Si falla la carga, la sección se queda (con su mensaje de error). */
  protected readonly hasNoUpdates = computed(() => this.updates.hasValue() && this.updates.value().length === 0);

  protected readonly loadedProjects = computed(() => (this.projects.hasValue() ? this.projects.value() : null));

  constructor() {
    // El túnel del tiempo del portal de Experiencia usa los años reales de la trayectoria (HU-21)
    const portals = inject(SectionPortalService);
    // Sin publicaciones, Actualidad desaparece de la página y del menú hasta que tenga contenido
    effect(() => portals.hidden.set(new Set(this.hasNoUpdates() ? ['updates'] : [])));

    effect(() => {
      const experience = this.loadedProfile()?.experience ?? [];
      portals.years.set([...new Set(experience.map((position) => Number(position.startedOn.slice(0, 4))))].sort());
    });

    effect(() => {
      const profile = this.loadedProfile();
      const seo = this.t().seo;
      if (!profile) {
        this.seo.setPage({ title: seo.homeTitle, description: seo.homeDescription, path: '/' });
        return;
      }
      const description = `${profile.headline}. ${seo.homeDescription}`.slice(0, 160);
      this.seo.setPortfolio(
        { title: profile.name, description, path: '/' },
        {
          name: profile.name,
          headline: profile.headline,
          location: profile.location,
          sameAs: [profile.links.github, profile.links.linkedin].filter((link): link is string => !!link),
        },
      );
    });
  }
}

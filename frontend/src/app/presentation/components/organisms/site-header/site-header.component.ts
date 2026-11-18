import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { LANGS, type Lang } from '../../../../core/i18n/lang';
import { SITE_NAME } from '../../../../core/seo/seo.service';
import { SectionPortalService, type PortalSection } from '../../../portal/section-portal.service';
import { prefersReducedMotion } from '../../../motion/motion';
import { LanguageSwitchComponent } from '../../molecules/language-switch/language-switch.component';
import { FLAG_IMAGES, LanguageFlagComponent } from '../../atoms/language-flag/language-flag.component';
import { NavLabelComponent } from '../../atoms/nav-label/nav-label.component';
import { NavPreviewComponent } from '../../atoms/nav-preview/nav-preview.component';

/** Cuánto se ve la bandera y cuándo empieza el cambio de idioma (cuando la bandera ya entró). */
const FLAG_MS = 1550;
const LANG_SWITCH_DELAY_MS = 220;

interface NavItem {
  label: string;
  path: string;
  fragment?: string;
  /** Escena del portal que se abre al pulsarlo (HU-21). */
  section: PortalSection;
}

/**
 * Cabecera fija con la navegación del sitio y el selector de idioma (spec.md, HU-14, HU-18 y HU-21).
 * - Cada enlace abre un portal 3D de su sección mientras la página navega por debajo.
 * - Al cambiar de idioma aparece la bandera (EE. UU. o España) y después cambian los textos.
 * En móvil, la lista se desplaza en horizontal debajo de la marca.
 */
@Component({
  imports: [RouterLink, RouterLinkActive, LanguageSwitchComponent, LanguageFlagComponent, NavLabelComponent, NavPreviewComponent],
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
})
export class SiteHeaderComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly portals = inject(SectionPortalService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly siteName = SITE_NAME;
  /** Icono de cada sección: en móvil va encima del texto, como en la barra de pestañas de una app. */
  protected readonly icons: Record<PortalSection, string> = { experience: '💼', about: '🙋', projects: '💻', updates: '📡', blog: '📖' };

  /** Bandera en pantalla: idioma y número de cambio (0 = ninguna). */
  /** Último enlace pulsado y número de pulsación: su texto reproduce el efecto de su sección. */
  private readonly effect = signal<{ section: PortalSection; run: number } | null>(null);

  protected readonly flagLang = signal<Lang>('es');
  protected readonly flagRun = signal(0);

  constructor() {
    // Las banderas se descargan en segundo plano: al pulsar ES / EN ya están listas y no aparece solo el mástil
    afterNextRender(() => {
      for (const lang of LANGS) new Image().src = FLAG_IMAGES[lang];
    });
  }

  /** Las anclas (#experiencia…) no cambian con el idioma: los enlaces compartidos siguen funcionando. */
  protected readonly items = computed<NavItem[]>(() => {
    const header = this.t().header;
    return [
      { label: header.experience, path: '/', fragment: 'experiencia', section: 'experience' },
      { label: header.about, path: '/', fragment: 'sobre-mi', section: 'about' },
      { label: header.projects, path: '/', fragment: 'proyectos', section: 'projects' },
      { label: header.updates, path: '/', fragment: 'actualidad', section: 'updates' },
    ];
  });

  /** Pulsar un enlace: su texto cuenta la sección y se abre el portal mientras la página navega por debajo. */
  protected activate(section: PortalSection, event: MouseEvent): void {
    if (!prefersReducedMotion()) {
      this.effect.update((current) => ({ section, run: (current?.run ?? 0) + 1 }));
    }
    this.portals.play(section, event);
  }

  protected effectRun(section: PortalSection): number {
    const effect = this.effect();
    return effect?.section === section ? effect.run : 0;
  }

  /** La bandera entra primero; el idioma cambia cuando ya está en pantalla, con su fundido. */
  protected changeLang(lang: Lang): void {
    if (!this.isBrowser) return;
    this.flagLang.set(lang);
    const run = this.flagRun() + 1;
    this.flagRun.set(run);
    const delay = prefersReducedMotion() ? 0 : LANG_SWITCH_DELAY_MS;
    setTimeout(() => void this.i18n.setLang(lang), delay);
    // Se quita al terminar, salvo que otro cambio haya empezado mientras tanto
    setTimeout(() => {
      if (this.flagRun() === run) this.flagRun.set(0);
    }, FLAG_MS);
  }
}

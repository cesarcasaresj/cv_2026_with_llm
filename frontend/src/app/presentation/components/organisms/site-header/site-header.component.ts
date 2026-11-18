import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { LanguageSwitchComponent } from '../../molecules/language-switch/language-switch.component';

interface NavItem {
  label: string;
  path: string;
  fragment?: string;
}

/**
 * Cabecera fija con la navegación del sitio y el selector de idioma (spec.md, HU-14 y HU-18).
 * En móvil, la lista se desplaza en horizontal debajo de la marca.
 */
@Component({
  imports: [RouterLink, RouterLinkActive, LanguageSwitchComponent],
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
})
export class SiteHeaderComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  /** Las anclas (#experiencia…) no cambian con el idioma: los enlaces compartidos siguen funcionando. */
  protected readonly items = computed<NavItem[]>(() => {
    const header = this.t().header;
    return [
      { label: header.experience, path: '/', fragment: 'experiencia' },
      { label: header.about, path: '/', fragment: 'sobre-mi' },
      { label: header.projects, path: '/', fragment: 'proyectos' },
      { label: header.updates, path: '/', fragment: 'actualidad' },
    ];
  });
}

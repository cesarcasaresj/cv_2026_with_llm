import { Component, inject, input } from '@angular/core';
import type { Profile } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { RevealDirective } from '../../../motion/reveal.directive';
import { SectionHeadingComponent } from '../../atoms/section-heading/section-heading.component';

/** Ruta del PDF del CV (frontend/public/cv/). */
export const CV_PDF_URL = '/cv/Cesar_Casares_CV.pdf';

/**
 * El resto del CV, como en el PDF para reclutadores (spec.md, HU-26): habilidades por área,
 * educación e idiomas, y el enlace para descargar el PDF. Todo es texto: se lee de un vistazo.
 */
@Component({
  imports: [RevealDirective, SectionHeadingComponent],
  selector: 'app-cv-details',
  templateUrl: './cv-details.component.html',
  styleUrl: './cv-details.component.css',
})
export class CvDetailsComponent {
  protected readonly t = inject(I18nService).t;
  protected readonly pdfUrl = CV_PDF_URL;

  readonly profile = input<Profile | null>(null);
  readonly state = input.required<ListState>();
}

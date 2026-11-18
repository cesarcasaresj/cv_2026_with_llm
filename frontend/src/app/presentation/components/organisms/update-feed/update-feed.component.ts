import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { ProfileUpdate } from '../../../../core/portfolio/portfolio.types';
import type { ListState } from '../../../../core/http/resource-state';
import { RevealDirective } from '../../../motion/reveal.directive';
import { SectionHeadingComponent } from '../../atoms/section-heading/section-heading.component';
import { I18nService } from '../../../../core/i18n/i18n.service';

/** Publicaciones recientes del autor en LinkedIn (spec.md, HU-17). */
@Component({
  imports: [DatePipe, RevealDirective, SectionHeadingComponent],
  selector: 'app-update-feed',
  templateUrl: './update-feed.component.html',
  styleUrl: './update-feed.component.css',
})
export class UpdateFeedComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly lang = this.i18n.lang;

  readonly updates = input<ProfileUpdate[] | null>(null);
  readonly state = input.required<ListState>();
  readonly linkedinUrl = input<string | null>(null);
}

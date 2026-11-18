import { Component, effect, inject, untracked } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { components } from '../../../../core/api/generated';
import { I18nService } from '../../../../core/i18n/i18n.service';

type PostCountResponse = components['schemas']['PostCountResponse'];

@Component({
  selector: 'app-post-counter',
  templateUrl: './post-counter.component.html',
  styleUrl: './post-counter.component.css',
})
export class PostCounterComponent {
  protected readonly t = inject(I18nService).t;

  private readonly announcer = inject(LiveAnnouncer);

  protected readonly posts = httpResource<PostCountResponse>(() => '/api/v1/posts/count');

  constructor() {
    // Anuncia cada cambio de estado en el contenedor global aria-live="polite".
    // El idioma se lee sin seguirlo (untracked): cambiar de idioma no debe repetir el anuncio.
    effect(() => {
      const text = untracked(this.t).postCounter;
      if (this.posts.isLoading()) {
        this.announcer.announce(text.announceLoading, 'polite');
      } else if (this.posts.error()) {
        this.announcer.announce(text.announceError, 'polite');
      } else if (this.posts.value()) {
        this.announcer.announce(text.announceTotal(this.posts.value()!.total), 'polite');
      }
    });
  }
}

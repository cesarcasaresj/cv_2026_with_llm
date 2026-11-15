import { Component, effect, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { components } from '../../../../core/api/generated';

type PostCountResponse = components['schemas']['PostCountResponse'];

@Component({
  selector: 'app-post-counter',
  templateUrl: './post-counter.component.html',
  styleUrl: './post-counter.component.css',
})
export class PostCounterComponent {
  private readonly announcer = inject(LiveAnnouncer);

  protected readonly posts = httpResource<PostCountResponse>(() => '/api/v1/posts/count');

  constructor() {
    // Anuncia cada cambio de estado en el contenedor global aria-live="polite"
    effect(() => {
      if (this.posts.isLoading()) {
        this.announcer.announce('Cargando el total de publicaciones', 'polite');
      } else if (this.posts.error()) {
        this.announcer.announce('No se pudo cargar el total de publicaciones', 'polite');
      } else if (this.posts.value()) {
        this.announcer.announce(`Total de publicaciones: ${this.posts.value()!.total}`, 'polite');
      }
    });
  }
}

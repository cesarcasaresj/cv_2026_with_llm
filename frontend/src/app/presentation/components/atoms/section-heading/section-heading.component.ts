import { Component, input } from '@angular/core';

/**
 * Encabezado de sección de la portada: número decorativo, título (<h2>) y entradilla opcional.
 * El número es aria-hidden: el lector de pantalla solo oye el título.
 */
@Component({
  selector: 'app-section-heading',
  template: `
    <div class="section-heading" [class.section-heading--on-night]="onNight()">
      <span class="section-heading__index" aria-hidden="true">{{ index() }}</span>
      <h2 class="section-heading__title" [id]="headingId()">{{ title() }}</h2>
      @if (intro()) {
        <p class="section-heading__intro">{{ intro() }}</p>
      }
    </div>
  `,
  styles: `
    .section-heading {
      display: grid;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .section-heading__index {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.9rem;
      letter-spacing: 0.25em;
      color: var(--color-accent);
    }

    .section-heading__index::after {
      content: '';
      display: inline-block;
      width: 3rem;
      height: 2px;
      margin-left: 0.75rem;
      vertical-align: middle;
      background: linear-gradient(90deg, var(--color-accent-bright), var(--color-teal));
    }

    .section-heading__title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(2rem, 7vw, 3.25rem);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.035em;
    }

    .section-heading__intro {
      max-width: 40rem;
      margin: 0;
      color: var(--color-text-muted);
      font-size: 1.1rem;
    }

    /* Sobre fondo nocturno (sección Actualidad) */
    .section-heading--on-night .section-heading__index {
      color: var(--color-teal);
    }

    .section-heading--on-night .section-heading__intro {
      color: var(--color-on-night-muted);
    }
  `,
})
export class SectionHeadingComponent {
  readonly index = input.required<string>();
  readonly title = input.required<string>();
  readonly headingId = input.required<string>();
  readonly intro = input<string | null>(null);
  /** true sobre fondo oscuro: ajusta los colores para mantener el contraste. */
  readonly onNight = input(false);
}

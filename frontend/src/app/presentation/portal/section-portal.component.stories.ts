import { Component, inject, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SectionPortalComponent } from './section-portal.component';
import { SectionPortalService, type PortalSection } from './section-portal.service';

/** Botones de prueba: cada uno abre el portal de su sección, como lo hace el menú de la cabecera. */
@Component({
  selector: 'app-section-portal-demo',
  imports: [SectionPortalComponent],
  template: `
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 2rem; min-height: 300px; background: #0b1020">
      @for (section of sections; track section) {
        <button type="button" (click)="portals.play(section)">{{ section }}</button>
      }
    </div>
    <app-section-portal />
  `,
})
class SectionPortalDemoComponent {
  protected readonly portals = inject(SectionPortalService);
  readonly years = input<number[]>([]);
  protected readonly sections: PortalSection[] = ['experience', 'about', 'projects', 'updates', 'blog'];

  constructor() {
    queueMicrotask(() => this.portals.years.set(this.years()));
  }
}

/**
 * Portales entre secciones (HU-21). Escenas 3D con three.js (necesitan WebGL); se saltan con clic o Esc.
 * Con "reducir movimiento" en el sistema no se abren: la navegación es directa.
 */
const meta: Meta<SectionPortalDemoComponent> = {
  title: 'Design System/Organisms/SectionPortal',
  component: SectionPortalDemoComponent,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<SectionPortalDemoComponent>;

/** El túnel del tiempo usa estos años, como en la portada. */
export const ConAnios: Story = { args: { years: [2016, 2019, 2020, 2022, 2024, 2025] } };

/** Sin años cargados: el túnel muestra los últimos cuatro años. */
export const SinAnios: Story = { args: { years: [] } };

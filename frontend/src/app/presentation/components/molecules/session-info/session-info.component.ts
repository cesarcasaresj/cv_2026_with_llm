import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import type { components } from '../../../../core/api/generated';

type UserResponse = components['schemas']['UserResponse'];

@Component({
  selector: 'app-session-info',
  templateUrl: './session-info.component.html',
  styleUrl: './session-info.component.css',
})
export class SessionInfoComponent {
  protected readonly t = inject(I18nService).t;
  /** Usuario de la sesión actual, o null si no se ha cargado. */
  readonly user = input<UserResponse | null>(null);
  readonly pending = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly loggedOut = output<void>();
}

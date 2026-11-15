import { Component, input, output } from '@angular/core';
import type { components } from '../../../../core/api/generated';

type UserResponse = components['schemas']['UserResponse'];

@Component({
  selector: 'app-session-info',
  templateUrl: './session-info.component.html',
  styleUrl: './session-info.component.css',
})
export class SessionInfoComponent {
  /** Usuario de la sesión actual, o null si no se ha cargado. */
  readonly user = input<UserResponse | null>(null);
  readonly pending = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly loggedOut = output<void>();
}

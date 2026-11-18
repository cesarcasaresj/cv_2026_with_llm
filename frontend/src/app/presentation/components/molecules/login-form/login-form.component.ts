import { Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface LoginCredentials {
  email: string;
  password: string;
}

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css',
})
export class LoginFormComponent {
  protected readonly t = inject(I18nService).t;
  /** true mientras se envían las credenciales (spec.md, HU-02). */
  readonly pending = input(false);
  /** Mensaje de error del intento anterior, o null. */
  readonly errorMessage = input<string | null>(null);
  readonly submitted = output<LoginCredentials>();

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}

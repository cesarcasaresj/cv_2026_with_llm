import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SeoService } from '../../../core/seo/seo.service';
import { LoginFormComponent, LoginCredentials } from '../../components/molecules/login-form/login-form.component';

const DEFAULT_AFTER_LOGIN = '/cuenta';
const GENERIC_ERROR = 'No pudimos iniciar sesión. Intenta de nuevo en unos minutos.';

@Component({
  imports: [LoginFormComponent],
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly announcer = inject(LiveAnnouncer);

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    inject(SeoService).setPage({
      title: 'Iniciar sesión',
      description: 'Acceso del autor del sitio.',
      path: '/login',
      noindex: true,
    });
  }

  protected async login(credentials: LoginCredentials): Promise<void> {
    this.pending.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.auth.login(credentials));
      await this.router.navigateByUrl(this.returnUrl());
    } catch (error) {
      // El backend ya redacta el mensaje para el usuario (ApiError.message); si no llega, uno genérico
      const apiMessage = error instanceof HttpErrorResponse ? (error.error as { message?: string } | null)?.message : undefined;
      const message = apiMessage ?? GENERIC_ERROR;
      this.errorMessage.set(message);
      this.announcer.announce(message, 'polite');
    } finally {
      this.pending.set(false);
    }
  }

  /** Solo rutas internas: evita redirecciones a otros sitios desde el parámetro returnUrl. */
  private returnUrl(): string {
    const requested = this.route.snapshot.queryParamMap.get('returnUrl');
    return requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : DEFAULT_AFTER_LOGIN;
  }
}

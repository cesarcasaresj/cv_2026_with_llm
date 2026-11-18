import { Component, effect, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SeoService } from '../../../core/seo/seo.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LoginFormComponent, LoginCredentials } from '../../components/molecules/login-form/login-form.component';

const DEFAULT_AFTER_LOGIN = '/cuenta';

@Component({
  imports: [LoginFormComponent],
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
  host: { class: 'l-page' },
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly seo = inject(SeoService);
  protected readonly t = inject(I18nService).t;

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    // En un effect: si cambia el idioma, el <title> cambia con él
    effect(() => {
      const text = this.t().login;
      this.seo.setPage({ title: text.title, description: text.seoDescription, path: '/login', noindex: true });
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
      const message = apiMessage ?? this.t().login.genericError;
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

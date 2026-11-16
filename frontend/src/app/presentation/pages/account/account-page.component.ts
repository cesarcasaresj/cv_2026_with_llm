import { Component, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { firstValueFrom } from 'rxjs';
import { AuthService, UserResponse } from '../../../core/auth/auth.service';
import { SeoService } from '../../../core/seo/seo.service';
import { SessionInfoComponent } from '../../components/molecules/session-info/session-info.component';

const LOGOUT_ERROR = 'No pudimos cerrar la sesión. Intenta de nuevo en unos minutos.';

@Component({
  imports: [SessionInfoComponent, RouterLink],
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.css',
})
export class AccountPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly announcer = inject(LiveAnnouncer);

  protected readonly user = httpResource<UserResponse>(() => '/api/v1/auth/me');
  protected readonly loggingOut = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    inject(SeoService).setPage({
      title: 'Mi cuenta',
      description: 'Sesión del autor del sitio.',
      path: '/cuenta',
      noindex: true,
    });
  }

  protected async logout(): Promise<void> {
    this.loggingOut.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.auth.logout());
      await this.router.navigateByUrl('/');
    } catch {
      this.errorMessage.set(LOGOUT_ERROR);
      this.announcer.announce(LOGOUT_ERROR, 'polite');
    } finally {
      this.loggingOut.set(false);
    }
  }
}

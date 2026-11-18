import { Component, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { firstValueFrom } from 'rxjs';
import { AuthService, UserResponse } from '../../../core/auth/auth.service';
import { SeoService } from '../../../core/seo/seo.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { SessionInfoComponent } from '../../components/molecules/session-info/session-info.component';

@Component({
  imports: [SessionInfoComponent, RouterLink],
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.css',
  host: { class: 'l-page' },
})
export class AccountPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly seo = inject(SeoService);
  protected readonly t = inject(I18nService).t;

  protected readonly user = httpResource<UserResponse>(() => '/api/v1/auth/me');
  protected readonly loggingOut = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      const text = this.t().account;
      this.seo.setPage({ title: text.title, description: text.seoDescription, path: '/cuenta', noindex: true });
    });
  }

  protected async logout(): Promise<void> {
    this.loggingOut.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.auth.logout());
      await this.router.navigateByUrl('/');
    } catch {
      const message = this.t().account.logoutError;
      this.errorMessage.set(message);
      this.announcer.announce(message, 'polite');
    } finally {
      this.loggingOut.set(false);
    }
  }
}

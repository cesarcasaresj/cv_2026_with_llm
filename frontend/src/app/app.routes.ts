import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { HomePageComponent } from './presentation/pages/home/home-page.component';
import { ArticlePageComponent } from './presentation/pages/article/article-page.component';
import { LoginPageComponent } from './presentation/pages/login/login-page.component';
import { AccountPageComponent } from './presentation/pages/account/account-page.component';

// El <title> y las etiquetas meta de cada página los fija SeoService (spec.md, HU-12),
// porque en los artículos dependen del contenido y no se conocen al definir la ruta.
export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'articulos/:slug', component: ArticlePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'cuenta', component: AccountPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];

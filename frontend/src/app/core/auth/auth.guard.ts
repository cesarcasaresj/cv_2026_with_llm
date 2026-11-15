import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Deja pasar solo con sesión válida. Sin sesión, redirige al login y recuerda la ruta pedida
 * para volver a ella tras iniciar sesión (spec.md, HU-05).
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.currentUser().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }))),
  );
};

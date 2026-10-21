import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.token()) return true;
  return inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.token()) return true;
  return inject(Router).createUrlTree(['/dashboard']);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const decide = (role: string | undefined) => (role === 'admin' ? true : router.createUrlTree(['/dashboard']));
  const current = auth.user();
  if (current) return decide(current.role);
  if (!auth.token()) return router.createUrlTree(['/login']);
  return auth.refresh().pipe(
    map((user) => decide(user.role)),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};

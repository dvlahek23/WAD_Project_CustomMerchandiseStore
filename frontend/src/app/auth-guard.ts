import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './core/auth';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.me().pipe(
    map(user => {
      if (user) {
        return true;
      }
      router.navigateByUrl('/login');
      return false;
    }),
    catchError(() => {
      router.navigateByUrl('/login');
      return of(false);
    })
  );
};

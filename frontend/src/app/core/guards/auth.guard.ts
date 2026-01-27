import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../user';
import { map, filter, take } from 'rxjs/operators';

// Basic auth guard - requires user to be logged in
export const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.loaded$.pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (userService.isLoggedIn) {
        return true;
      }
      router.navigateByUrl('/login');
      return false;
    })
  );
};

// Guest guard - only allows non-authenticated users (for login/register pages)
export const guestGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.loaded$.pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (!userService.isLoggedIn) {
        return true;
      }
      router.navigateByUrl('/');
      return false;
    })
  );
};

// Admin guard - requires administrator role
export const adminGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.loaded$.pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (userService.isAdmin) {
        return true;
      }
      router.navigateByUrl('/');
      return false;
    })
  );
};

// Management guard - requires management or administrator role
export const managementGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.loaded$.pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (userService.isAdmin || userService.isManagement) {
        return true;
      }
      router.navigateByUrl('/');
      return false;
    })
  );
};

// Designer guard - requires designer user type
export const designerGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.loaded$.pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (userService.isDesigner || userService.isAdmin || userService.isManagement) {
        return true;
      }
      router.navigateByUrl('/');
      return false;
    })
  );
};

// Customer guard - requires customer user type
export const customerGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.loaded$.pipe(
    filter(loaded => loaded),
    take(1),
    map(() => {
      if (userService.isCustomer || userService.isAdmin || userService.isManagement) {
        return true;
      }
      router.navigateByUrl('/');
      return false;
    })
  );
};

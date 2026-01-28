import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../user';
import { map, filter, take } from 'rxjs/operators';

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

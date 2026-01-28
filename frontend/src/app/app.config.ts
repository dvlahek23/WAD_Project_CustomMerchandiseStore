import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { UserService } from './core/user';
import { catchError, of } from 'rxjs';

const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const clonedReq = req.clone({ withCredentials: true });
  return next(clonedReq);
};

function initializeUser() {
  const userService = inject(UserService);
  const platformId = inject(PLATFORM_ID);

  return () => {
    if (isPlatformBrowser(platformId)) {
      return userService.loadUser().pipe(catchError(() => of(null)));
    }
    return of(null);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeUser,
      multi: true,
    },
  ]
};

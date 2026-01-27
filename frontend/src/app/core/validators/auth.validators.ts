import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../auth';

@Injectable({ providedIn: 'root' })
export class AuthValidators {

  constructor(private auth: AuthService) {}

  usernameAvailableValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 3) {
        return of(null);
      }

      return timer(400).pipe(
        switchMap(() => this.auth.checkUsernameAvailability(control.value)),
        map(result => result.available ? null : { usernameTaken: true }),
        catchError(() => of(null))
      );
    };
  }

  emailAvailableValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || !control.value.includes('@')) {
        return of(null);
      }

      return timer(400).pipe(
        switchMap(() => this.auth.checkEmailAvailability(control.value)),
        map(result => result.available ? null : { emailTaken: true }),
        catchError(() => of(null))
      );
    };
  }
}

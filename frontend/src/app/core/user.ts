import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth';

export interface User {
  user_id: number;
  email: string;
  username: string;
  role: 'administrator' | 'management' | 'control' | 'regular';
  userTypes: ('customer' | 'designer')[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private platformId = inject(PLATFORM_ID);
  private userSubject = new BehaviorSubject<User | null>(null);
  private loadedSubject: BehaviorSubject<boolean>;

  user$ = this.userSubject.asObservable();
  loaded$: Observable<boolean>;

  constructor(private auth: AuthService) {
    // On server, mark as loaded immediately to prevent guards from waiting
    const initialLoaded = !isPlatformBrowser(this.platformId);
    this.loadedSubject = new BehaviorSubject<boolean>(initialLoaded);
    this.loaded$ = this.loadedSubject.asObservable();
  }

  get user(): User | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  get isAdmin(): boolean {
    return this.user?.role?.toLowerCase() === 'administrator';
  }

  get isManagement(): boolean {
    return this.user?.role?.toLowerCase() === 'management';
  }

  get isRegular(): boolean {
    return this.user?.role?.toLowerCase() === 'regular';
  }

  get isCustomer(): boolean {
    return this.user?.userTypes?.some(t => t.toLowerCase() === 'customer') ?? false;
  }

  get isDesigner(): boolean {
    return this.user?.userTypes?.some(t => t.toLowerCase() === 'designer') ?? false;
  }

  hasRole(...roles: string[]): boolean {
    return this.user ? roles.includes(this.user.role) : false;
  }

  hasUserType(...types: string[]): boolean {
    return this.user?.userTypes?.some(t => types.includes(t)) ?? false;
  }

  loadUser(): Observable<User | null> {
    return this.auth.me().pipe(
      tap((user: any) => {
        this.userSubject.next(user);
        this.loadedSubject.next(true);
      })
    );
  }

  setUser(user: User | null): void {
    this.userSubject.next(user);
  }

  clearUser(): void {
    this.userSubject.next(null);
  }
}

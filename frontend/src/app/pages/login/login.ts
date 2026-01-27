import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth';
import { UserService } from '../../core/user';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email = '';
  password = '';
  error = '';

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  onSubmit() {
    this.auth.login(this.email, this.password).pipe(
      switchMap(() => this.userService.loadUser())
    ).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: err => this.error = err.error?.error || 'Login failed'
    });
  }
}

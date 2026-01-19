import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  username: string = '';
  email: string = '';
  password: string = '';
  error: string = '';
  success: string = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.error = '';
    this.success = '';

    this.auth.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.success = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.router.navigateByUrl('/login'), 1500);
      },
      error: (err) => {
        this.error = err.error?.error || 'Registration failed';
      }
    });
  }
}

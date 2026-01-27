import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth';
import { AuthValidators } from '../../core/validators/auth.validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;
  error: string = '';
  success: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private authValidators: AuthValidators,
    private router: Router
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      username: ['',
        [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_]+$/)],
        [this.authValidators.usernameAvailableValidator()]
      ],
      email: ['',
        [Validators.required, Validators.email, Validators.maxLength(50)],
        [this.authValidators.emailAvailableValidator()]
      ],
      password: ['', [Validators.required]]
    });
  }

  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.error = '';
    this.success = '';

    const { username, email, password } = this.registerForm.value;

    this.auth.register(username, email, password).subscribe({
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

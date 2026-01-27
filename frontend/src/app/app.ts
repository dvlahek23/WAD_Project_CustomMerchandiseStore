import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from './core/user';
import { AuthService } from './core/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {

  constructor(
    public userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  get roleDisplay(): string {
    const role = this.userService.user?.role;
    if (!role) return '';

    const roleNames: Record<string, string> = {
      'administrator': 'Admin',
      'management': 'Manager',
      'control': 'Control',
      'regular': 'User'
    };
    return roleNames[role.toLowerCase()] || role;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.userService.clearUser();
        this.router.navigateByUrl('/');
      }
    });
  }
}

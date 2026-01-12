import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Api } from './core/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  message: string | null = null;

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.api.getHello().subscribe({
      next: (res) => this.message = res.message,
      error: (err) => console.error('Backend error:', err)
    });
  }
}

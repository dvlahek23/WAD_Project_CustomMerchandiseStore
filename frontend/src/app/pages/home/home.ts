import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  products = [
    { name: 'T-Shirt', price: 9.90, color: '#5A3A31' },
    { name: 'Hoodie', price: 29.90, color: '#84714F' },
    { name: 'Mug', price: 7.90, color: '#C4A35A' },
    { name: 'Cap', price: 14.90, color: '#556B2F' },
    { name: 'Bag', price: 19.90, color: '#722F37' },
    { name: 'Sticker', price: 2.90, color: '#4A7C59' },
  ];
}

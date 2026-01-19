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
    { name: 'T-Shirt', emoji: '👕', price: 9.90, color: '#5A3A31', customText: 'Your Text' },
    { name: 'Hoodie', emoji: '🧥', price: 29.90, color: '#84714F', customText: 'Team Name' },
    { name: 'Mug', emoji: '☕', price: 7.90, color: '#C4A35A', customText: 'Coffee Time' },
    { name: 'Cap', emoji: '🧢', price: 14.90, color: '#556B2F', customText: 'Go Team' },
    { name: 'Bag', emoji: '👜', price: 19.90, color: '#722F37', customText: 'My Brand' },
    { name: 'Sticker', emoji: '🏷️', price: 2.90, color: '#4A7C59', customText: 'Cool Stuff' },
  ];
}

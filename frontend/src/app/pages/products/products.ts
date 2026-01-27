import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductsService, Product, Category } from '../../core/products.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class Products implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  productTypes: string[] = [];

  selectedCategory = '';
  selectedType = '';
  searchQuery = '';

  loading = true;


  // Color mapping for categories
  categoryColors: Record<string, string> = {
    'Clothing': '#5A3A31',
    'Accessories': '#84714F',
    'Drinkware': '#C4A35A',
    'Stationery': '#4A7C59',
  };

  constructor(private productsService: ProductsService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    // Load categories and types first
    this.productsService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      }
    });

    this.productsService.getProductTypes().subscribe({
      next: (types) => {
        this.productTypes = types;
      }
    });

    // Load products
    this.productsService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(product => {
      const matchesCategory = !this.selectedCategory || product.category_name === this.selectedCategory;
      const matchesType = !this.selectedType || product.product_type === this.selectedType;
      const matchesSearch = !this.searchQuery ||
        product.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesCategory && matchesType && matchesSearch;
    });
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedType = '';
    this.searchQuery = '';
    this.filteredProducts = this.products;
  }

  getCardColor(categoryName: string): string {
    return this.categoryColors[categoryName] || '#5A3A31';
  }
}

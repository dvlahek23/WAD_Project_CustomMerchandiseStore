import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductsService, Product, Category } from '../../core/products.service';
import { UserService } from '../../core/user';

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './manage-products.html',
  styleUrls: ['./manage-products.css'],
})
export class ManageProducts implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  error = '';

  showModal = false;
  editingProduct: Product | null = null;

  formName = '';
  formDescription = '';
  formBasePrice = 0;
  formProductType = '';
  formCategoryId = 0;
  formPictureUrl = '';

  productToDelete: Product | null = null;

  constructor(
    private productsService: ProductsService,
    public userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    this.loading = true;
    this.productsService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load products';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.productsService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal() {
    this.editingProduct = null;
    this.formName = '';
    this.formDescription = '';
    this.formBasePrice = 0;
    this.formProductType = '';
    this.formCategoryId = this.categories.length > 0 ? this.categories[0].category_id : 0;
    this.formPictureUrl = '';
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.editingProduct = product;
    this.formName = product.name;
    this.formDescription = product.description;
    this.formBasePrice = product.base_price;
    this.formProductType = product.product_type;
    this.formCategoryId = product.category_id;
    this.formPictureUrl = product.picture_url;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingProduct = null;
  }

  saveProduct() {
    const productData = {
      name: this.formName,
      description: this.formDescription,
      base_price: this.formBasePrice,
      product_type: this.formProductType,
      category_id: this.formCategoryId,
      picture_url: this.formPictureUrl
    };

    if (this.editingProduct) {
      this.productsService.updateProduct(this.editingProduct.product_id, productData).subscribe({
        next: () => {
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          alert(err.error?.error || 'Failed to update product');
        }
      });
    } else {
      this.productsService.createProduct(productData).subscribe({
        next: () => {
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          alert(err.error?.error || 'Failed to create product');
        }
      });
    }
  }

  promptDelete(product: Product) {
    this.productToDelete = product;
  }

  cancelDelete() {
    this.productToDelete = null;
  }

  confirmDelete() {
    if (!this.productToDelete) return;

    this.productsService.deleteProduct(this.productToDelete.product_id).subscribe({
      next: () => {
        this.productToDelete = null;
        this.loadProducts();
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to delete product');
        this.productToDelete = null;
      }
    });
  }

  getCategoryName(categoryId: number): string {
    const cat = this.categories.find(c => c.category_id === categoryId);
    return cat?.name || '-';
  }
}

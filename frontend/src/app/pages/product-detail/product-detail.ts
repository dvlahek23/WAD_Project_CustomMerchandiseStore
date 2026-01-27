import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductsService, Product } from '../../core/products.service';
import { UserService } from '../../core/user';
import { OrdersService } from '../../core/orders.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetail implements OnInit {
  product: Product | null = null;
  loading = true;
  error = '';

  // Customization options
  customText = '';
  quantity = 1;
  selectedColor = '#ffffff';

  // Text box position and size (percentage)
  textBoxX = 50;
  textBoxY = 50;
  textBoxWidth = 40;
  textBoxHeight = 20;

  // Image box position and size (percentage)
  uploadedImage: string | null = null;
  imageBoxX = 50;
  imageBoxY = 50;
  imageBoxWidth = 30;
  imageBoxHeight = 30;

  // Dragging state
  isDragging = false;
  isResizing = false;
  isDraggingImage = false;
  isResizingImage = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private containerRect: DOMRect | null = null;

  // Available colors for customization
  colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#000000' },
    { name: 'Navy', value: '#1a365d' },
    { name: 'Red', value: '#c53030' },
    { name: 'Green', value: '#276749' },
    { name: 'Gray', value: '#4a5568' },
  ];

  // Category color mapping
  categoryColors: Record<string, string> = {
    'Clothing': '#5A3A31',
    'Accessories': '#84714F',
    'Drinkware': '#C4A35A',
    'Stationery': '#4A7C59',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    public userService: UserService,
    private ordersService: OrdersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(parseInt(productId));
    } else {
      this.error = 'Product not found';
      this.loading = false;
    }
  }

  loadProduct(id: number) {
    this.productsService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Product not found';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalPrice(): number {
    if (!this.product) return 0;
    return this.product.base_price * this.quantity;
  }

  getCategoryColor(): string {
    if (!this.product) return '#5A3A31';
    return this.categoryColors[this.product.category_name] || '#5A3A31';
  }

  incrementQuantity() {
    if (this.quantity < 99) {
      this.quantity++;
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (!this.userService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    // For now, just place order directly (cart not implemented)
    this.orderNow();
  }

  orderNow() {
    if (!this.userService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.product) return;

    const orderData = {
      productId: this.product.product_id,
      quantity: this.quantity,
      customText: this.customText || undefined,
      textColor: this.selectedColor,
      textPositionX: this.textBoxX,
      textPositionY: this.textBoxY,
      textWidth: this.textBoxWidth,
      textHeight: this.textBoxHeight,
      customImage: this.uploadedImage || undefined,
      imagePositionX: this.uploadedImage ? this.imageBoxX : undefined,
      imagePositionY: this.uploadedImage ? this.imageBoxY : undefined,
      imageWidth: this.uploadedImage ? this.imageBoxWidth : undefined,
      imageHeight: this.uploadedImage ? this.imageBoxHeight : undefined,
    };

    this.ordersService.createOrder(orderData).subscribe({
      next: () => {
        alert(`Order placed for ${this.quantity}x ${this.product?.name}!\nYour order is now pending designer review.`);
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to place order');
      }
    });
  }

  // Drag functionality
  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    this.isResizing = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onResizeStart(event: MouseEvent) {
    this.isResizing = true;
    this.isDragging = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.containerRect) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    const percentX = (deltaX / this.containerRect.width) * 100;
    const percentY = (deltaY / this.containerRect.height) * 100;

    if (this.isDragging) {
      this.textBoxX = Math.max(10, Math.min(90, this.textBoxX + percentX));
      this.textBoxY = Math.max(10, Math.min(90, this.textBoxY + percentY));
    }

    if (this.isResizing) {
      this.textBoxWidth = Math.max(15, Math.min(80, this.textBoxWidth + percentX));
      this.textBoxHeight = Math.max(10, Math.min(60, this.textBoxHeight + percentY));
    }

    if (this.isDraggingImage) {
      this.imageBoxX = Math.max(10, Math.min(90, this.imageBoxX + percentX));
      this.imageBoxY = Math.max(10, Math.min(90, this.imageBoxY + percentY));
    }

    if (this.isResizingImage) {
      this.imageBoxWidth = Math.max(10, Math.min(80, this.imageBoxWidth + percentX));
      this.imageBoxHeight = Math.max(10, Math.min(80, this.imageBoxHeight + percentY));
    }

    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.cdr.detectChanges();
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.isDraggingImage = false;
    this.isResizingImage = false;
    this.containerRect = null;
  }

  // Image upload
  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImage = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeUploadedImage() {
    this.uploadedImage = null;
    // Reset file input so the same file can be selected again
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
  }

  onImageDragStart(event: MouseEvent) {
    this.isDraggingImage = true;
    this.isResizingImage = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onImageResizeStart(event: MouseEvent) {
    this.isResizingImage = true;
    this.isDraggingImage = false;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    const container = (event.target as HTMLElement).closest('.preview-image-container');
    if (container) {
      this.containerRect = container.getBoundingClientRect();
    }

    event.preventDefault();
    event.stopPropagation();
  }
}
